import os
import time
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.models import TrustStatus, KnowledgeType

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
    
    # Override SessionLocal inside documents endpoint to use our in-memory test session
    import app.api.v1.endpoints.documents as docs_endpoint
    original_session_local = docs_endpoint.SessionLocal
    docs_endpoint.SessionLocal = lambda: session
    
    try:
        yield session
    finally:
        docs_endpoint.SessionLocal = original_session_local
        session.close()

@pytest.fixture
def sample_pdf_path():
    path = os.path.join(os.path.dirname(__file__), "..", "test_data", "golden_dataset", "fastener_sample_catalog.pdf")
    return os.path.abspath(path)

@pytest.mark.asyncio
async def test_end_to_end_pipeline_and_api(test_db, sample_pdf_path):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Step 1: Upload Document
        with open(sample_pdf_path, "rb") as f:
            files = {"file": ("fastener_sample_catalog.pdf", f, "application/pdf")}
            upload_res = await client.post("/api/v1/documents/upload", files=files)
        
        assert upload_res.status_code == 201
        job_data = upload_res.json()
        job_id = job_data["id"]
        assert job_data["status"] == "PENDING"

        # Step 2: Poll Job Status until completed (simulate async background execution in sync test)
        # Note: Since the upload endpoint schedules run_orchestrator_background_task as a FastAPI BackgroundTask,
        # and AsyncClient with ASGITransport runs background tasks immediately upon response return,
        # the job should already be completed or running.
        max_retries = 5
        job_completed = False
        for _ in range(max_retries):
            job_status_res = await client.get(f"/api/v1/jobs/{job_id}")
            assert job_status_res.status_code == 200
            current_job = job_status_res.json()
            if current_job["status"] == "COMPLETED":
                job_completed = True
                break
            time.sleep(0.5)

        assert job_completed, "Pipeline background task did not complete in time."

        # Step 3: Get List of Processed Products
        products_res = await client.get("/api/v1/products")
        assert products_res.status_code == 200
        products = products_res.json()
        assert len(products) >= 2

        # Step 4: Verify Product Attributes and Confidence Breakdown
        prod_id = products[0]["id"]
        detail_res = await client.get(f"/api/v1/products/{prod_id}")
        assert detail_res.status_code == 200
        product_detail = detail_res.json()
        assert len(product_detail["attributes"]) >= 4

        # Step 5: Test Manual Override Patch
        target_attr = product_detail["attributes"][0]
        attr_id = target_attr["id"]
        
        patch_res = await client.patch(
            f"/api/v1/products/{prod_id}/attributes/{attr_id}",
            json={
                "normalized_value": "Overridden Value E2E",
                "trust_status": "VERIFIED",
                "knowledge_type": "EXPLICIT_FACT"
            }
        )
        assert patch_res.status_code == 200
        patched_attr = patch_res.json()
        assert patched_attr["normalized_value"] == "Overridden Value E2E"
        assert patched_attr["trust_status"] == "VERIFIED"

        # Step 6: Verify Health Score Recalculation
        updated_detail_res = await client.get(f"/api/v1/products/{prod_id}")
        updated_product = updated_detail_res.json()
        assert updated_product["health_score"] > 0.0

        # Step 7: Export PIM Data in JSON
        export_json_res = await client.get(f"/api/v1/products/{prod_id}/export?format=json")
        assert export_json_res.status_code == 200
        json_data = export_json_res.json()
        assert json_data["product_name"] == updated_product["name"]

        # Step 8: Export PIM Data in CSV
        export_csv_res = await client.get(f"/api/v1/products/{prod_id}/export?format=csv")
        assert export_csv_res.status_code == 200
        assert "Product ID,Product Name" in export_csv_res.text

    app.dependency_overrides.clear()
