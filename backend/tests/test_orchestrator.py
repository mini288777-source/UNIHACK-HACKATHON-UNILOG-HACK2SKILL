import os
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import SourceDocument, ProcessingJob, Product, ProductAttribute, Evidence, Conflict, TrustStatus
from app.pipeline.orchestrator import PipelineOrchestrator
from app.pipeline.conflict import ConflictDetector

@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def sample_pdf_path():
    path = os.path.join(os.path.dirname(__file__), "..", "test_data", "golden_dataset", "fastener_sample_catalog.pdf")
    return os.path.abspath(path)

def test_full_pipeline_orchestration(db_session, sample_pdf_path):
    doc = SourceDocument(
        filename="fastener_sample_catalog.pdf",
        file_path=sample_pdf_path,
        file_size=os.path.getsize(sample_pdf_path)
    )
    db_session.add(doc)
    db_session.commit()

    job = ProcessingJob(
        document_id=doc.id,
        status="PENDING",
        current_stage="INGESTING",
        progress_pct=5.0
    )
    db_session.add(job)
    db_session.commit()

    # Run full orchestrator
    orchestrator = PipelineOrchestrator(db_session)
    orchestrator.run_pipeline_job(job.id)

    db_session.refresh(job)
    assert job.status == "COMPLETED"
    assert job.progress_pct == 100.0
    assert job.completed_at is not None

    # Verify persisted products
    products = db_session.query(Product).filter(Product.document_id == doc.id).all()
    assert len(products) >= 2

    bolt = [p for p in products if "Bolt" in p.name][0]
    assert bolt.health_score > 50.0
    assert len(bolt.attributes) >= 4

    mat_attr = [a for a in bolt.attributes if a.name == "Material"][0]
    assert mat_attr.normalized_value == "Stainless Steel 304"
    assert mat_attr.trust_status == TrustStatus.VERIFIED
    assert mat_attr.confidence >= 0.90
    assert mat_attr.evidence is not None
    assert mat_attr.evidence.page_number in [1, 2]
    assert "SS304" in mat_attr.evidence.text_quote

def test_conflict_detection_between_documents(db_session):
    # Existing product in DB from Doc 1
    prod1 = Product(name="M10 Hex Bolt", sku="M10-BOLT-001")
    db_session.add(prod1)
    db_session.commit()

    attr1 = ProductAttribute(
        product_id=prod1.id,
        name="Material",
        raw_value="SS304",
        normalized_value="Stainless Steel 304",
        trust_status=TrustStatus.VERIFIED
    )
    db_session.add(attr1)
    db_session.commit()

    ev1 = Evidence(
        attribute_id=attr1.id,
        document_id="doc_1",
        page_number=1,
        text_quote="Material: SS304"
    )
    db_session.add(ev1)
    db_session.commit()

    # New product from Doc 2 with conflicting Material SS316
    prod2 = Product(name="M10 Hex Bolt", sku="M10-BOLT-001")
    db_session.add(prod2)
    db_session.commit()

    extracted_attrs = [
        {"name": "Material", "normalized_value": "Stainless Steel 316", "trust_status": TrustStatus.VERIFIED}
    ]

    conflicts = ConflictDetector.detect_and_record_conflicts(
        db=db_session,
        product_id=prod2.id,
        current_doc_id="doc_2",
        extracted_attributes=extracted_attrs
    )

    assert len(conflicts) == 1
    assert conflicts[0].attribute_name == "Material"
    assert conflicts[0].doc1_value == "Stainless Steel 316"
    assert conflicts[0].doc2_value == "Stainless Steel 304"
    assert extracted_attrs[0]["trust_status"] == TrustStatus.CONFLICT
