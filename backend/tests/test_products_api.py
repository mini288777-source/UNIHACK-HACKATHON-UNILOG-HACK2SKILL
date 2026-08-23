import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.models import Product, ProductAttribute, Evidence, Conflict, TrustStatus, KnowledgeType

@pytest.fixture
def test_db():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def seed_product(test_db):
    product = Product(
        name="Hex Head Bolt M10 x 50mm",
        category="Fasteners > Bolts",
        manufacturer="Acme Fasteners",
        sku="M10-BOLT-50",
        health_score=85.0
    )
    test_db.add(product)
    test_db.commit()
    test_db.refresh(product)

    attr = ProductAttribute(
        product_id=product.id,
        name="Material",
        raw_value="SS304",
        normalized_value="Stainless Steel 304",
        knowledge_type=KnowledgeType.NORMALIZED_FACT,
        trust_status=TrustStatus.VERIFIED,
        confidence=0.95
    )
    test_db.add(attr)
    test_db.commit()
    test_db.refresh(attr)

    ev = Evidence(
        attribute_id=attr.id,
        document_id="doc_123",
        page_number=1,
        text_quote="Material Specification: Grade SS304"
    )
    test_db.add(ev)
    test_db.commit()

    conflict = Conflict(
        product_id=product.id,
        attribute_name="Length",
        doc1_value="50mm",
        doc2_value="55mm",
        status="UNRESOLVED"
    )
    test_db.add(conflict)
    test_db.commit()

    return product, attr

@pytest.mark.asyncio
async def test_products_api_endpoints(seed_product, test_db):
    product, attr = seed_product

    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. List Products
        list_res = await client.get("/api/v1/products")
        assert list_res.status_code == 200
        products_list = list_res.json()
        assert len(products_list) >= 1
        assert products_list[0]["id"] == product.id

        # 2. Get Single Product Detail
        prod_res = await client.get(f"/api/v1/products/{product.id}")
        assert prod_res.status_code == 200
        prod_data = prod_res.json()
        assert prod_data["name"] == "Hex Head Bolt M10 x 50mm"
        assert len(prod_data["attributes"]) == 1
        assert prod_data["attributes"][0]["normalized_value"] == "Stainless Steel 304"
        assert prod_data["attributes"][0]["evidence"]["page_number"] == 1

        # 3. Patch Attribute Value
        patch_res = await client.patch(
            f"/api/v1/products/{product.id}/attributes/{attr.id}",
            json={"normalized_value": "Stainless Steel 304 (V4A Verified)", "trust_status": "VERIFIED"}
        )
        assert patch_res.status_code == 200
        patched_data = patch_res.json()
        assert patched_data["normalized_value"] == "Stainless Steel 304 (V4A Verified)"

        # 4. Get Product Conflicts
        conf_res = await client.get(f"/api/v1/products/{product.id}/conflicts")
        assert conf_res.status_code == 200
        conflicts = conf_res.json()
        assert len(conflicts) == 1
        assert conflicts[0]["attribute_name"] == "Length"
        assert conflicts[0]["doc1_value"] == "50mm"

        # 5. Export JSON
        export_json_res = await client.get(f"/api/v1/products/{product.id}/export?format=json")
        assert export_json_res.status_code == 200
        json_export = export_json_res.json()
        assert json_export["product_name"] == "Hex Head Bolt M10 x 50mm"
        assert len(json_export["attributes"]) == 1

        # 6. Export CSV
        export_csv_res = await client.get(f"/api/v1/products/{product.id}/export?format=csv")
        assert export_csv_res.status_code == 200
        csv_text = export_csv_res.text
        assert "Product ID,Product Name" in csv_text
        assert "Hex Head Bolt M10 x 50mm" in csv_text

    app.dependency_overrides.clear()
