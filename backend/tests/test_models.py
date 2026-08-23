import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.models import (
    SourceDocument, ProcessingJob, Product, ProductAttribute,
    Evidence, Conflict, KnowledgeType, TrustStatus
)

# In-memory SQLite for testing models
@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

def test_create_document_and_job(db_session):
    doc = SourceDocument(
        filename="fastener_catalog_2024.pdf",
        file_path="/uploads/test.pdf",
        file_size=102400
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    assert doc.id is not None
    assert doc.filename == "fastener_catalog_2024.pdf"

    job = ProcessingJob(
        document_id=doc.id,
        status="PROCESSING",
        current_stage="EXTRACTING",
        progress_pct=25.0
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)

    assert job.id is not None
    assert job.document.filename == "fastener_catalog_2024.pdf"

def test_product_attributes_and_evidence(db_session):
    doc = SourceDocument(
        filename="hex_bolt_spec.pdf",
        file_path="/uploads/bolt.pdf",
        file_size=51200
    )
    db_session.add(doc)
    db_session.commit()

    product = Product(
        document_id=doc.id,
        name="Hex Head Bolt M10 x 50mm",
        category="Fasteners > Bolts > Hex Bolts",
        manufacturer="Acme Fasteners",
        health_score=95.0
    )
    db_session.add(product)
    db_session.commit()

    attr = ProductAttribute(
        product_id=product.id,
        name="Material",
        raw_value="SS304",
        normalized_value="Stainless Steel 304",
        knowledge_type=KnowledgeType.NORMALIZED_FACT,
        trust_status=TrustStatus.VERIFIED,
        confidence=0.98,
        is_inferred=False
    )
    db_session.add(attr)
    db_session.commit()

    ev = Evidence(
        attribute_id=attr.id,
        document_id=doc.id,
        page_number=12,
        text_quote="Material Specification: Grade SS304 Stainless",
        confidence_breakdown={"evidence_exactness": 1.0, "schema_validity": 1.0}
    )
    db_session.add(ev)
    db_session.commit()

    db_session.refresh(product)
    assert len(product.attributes) == 1
    fetched_attr = product.attributes[0]
    assert fetched_attr.normalized_value == "Stainless Steel 304"
    assert fetched_attr.trust_status == TrustStatus.VERIFIED
    assert fetched_attr.evidence.page_number == 12
    assert fetched_attr.evidence.text_quote == "Material Specification: Grade SS304 Stainless"

def test_conflict_creation(db_session):
    product = Product(name="M10 Washer")
    db_session.add(product)
    db_session.commit()

    conflict = Conflict(
        product_id=product.id,
        attribute_name="Inner Diameter",
        doc1_value="10.2mm",
        doc2_value="10.5mm",
        status="UNRESOLVED"
    )
    db_session.add(conflict)
    db_session.commit()

    db_session.refresh(product)
    assert len(product.conflicts) == 1
    assert product.conflicts[0].attribute_name == "Inner Diameter"
    assert product.conflicts[0].doc1_value == "10.2mm"
