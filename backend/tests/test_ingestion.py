import os
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.core.security import sanitize_filename, sanitize_prompt_content
from app.pipeline.ingestion import PDFIngestionEngine

# Test Database setup
@pytest.fixture
def test_db():
    engine = create_engine("sqlite:///:memory:")
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

def test_security_sanitization():
    unsafe_name = "../../etc/passwd/malicious_bolt.pdf"
    clean_name = sanitize_filename(unsafe_name)
    assert ".." not in clean_name
    assert clean_name == "malicious_bolt.pdf"

    prompt_wrapper = sanitize_prompt_content("Hex Bolt M10 SS304")
    assert "<untrusted_document_content>" in prompt_wrapper
    assert "Hex Bolt M10 SS304" in prompt_wrapper

def test_pdf_ingestion_engine(sample_pdf_path):
    assert os.path.exists(sample_pdf_path)
    engine = PDFIngestionEngine()
    extracted_doc = engine.extract_document(sample_pdf_path)

    assert extracted_doc.total_pages == 2
    assert "Heavy Hex Head Bolt M10 x 50mm" in extracted_doc.full_text
    assert "DIN 933" in extracted_doc.full_text
    assert len(extracted_doc.pages) == 2
    assert extracted_doc.pages[0].page_number == 1
    assert extracted_doc.pages[1].page_number == 2

from sqlalchemy.pool import StaticPool

@pytest.mark.asyncio
async def test_upload_endpoint(sample_pdf_path):
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        with open(sample_pdf_path, "rb") as f:
            response = await client.post(
                "/api/v1/documents/upload",
                files={"file": ("fastener_sample_catalog.pdf", f, "application/pdf")}
            )

        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["status"] == "PENDING"
        assert data["current_stage"] == "INGESTING"

        job_id = data["id"]
        job_res = await client.get(f"/api/v1/jobs/{job_id}")
        assert job_res.status_code == 200
        job_data = job_res.json()
        assert job_data["id"] == job_id

    app.dependency_overrides.clear()
