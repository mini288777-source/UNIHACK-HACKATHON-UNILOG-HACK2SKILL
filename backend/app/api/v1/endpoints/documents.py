import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.session import get_db, SessionLocal
from app.db.models import SourceDocument, ProcessingJob
from app.core.security import validate_upload_file
from app.schemas.document import DocumentResponse
from app.schemas.job import JobResponse
from app.pipeline.orchestrator import run_orchestrator_background_task

router = APIRouter(prefix="/documents", tags=["Documents"])

@router.post("/upload", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Accepts PDF upload, validates file type & size limit (20MB), saves securely,
    initializes SourceDocument + ProcessingJob, and schedules background processing.
    """
    file_path = validate_upload_file(file)

    # Stream upload in 1MB chunks to disk with 20MB size check
    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
    CHUNK_SIZE = 1024 * 1024  # 1MB
    file_size = 0

    try:
        with open(file_path, "wb") as f:
            while True:
                chunk = await file.read(CHUNK_SIZE)
                if not chunk:
                    break
                file_size += len(chunk)
                if file_size > MAX_FILE_SIZE:
                    f.close()
                    if os.path.exists(file_path):
                        os.remove(file_path)
                    raise HTTPException(
                        status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                        detail="File size exceeds maximum allowed limit of 20MB."
                    )
                f.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {str(e)}"
        )

    # Create SourceDocument record
    doc = SourceDocument(
        filename=file.filename,
        file_path=file_path,
        file_size=file_size,
        mime_type=file.content_type or "application/pdf"
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Create ProcessingJob record
    job = ProcessingJob(
        document_id=doc.id,
        status="PENDING",
        current_stage="INGESTING",
        progress_pct=5.0
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Schedule background processing task
    background_tasks.add_task(run_orchestrator_background_task, job.id, SessionLocal)

    return job

@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(document_id: str, db: Session = Depends(get_db)):
    """
    Fetches source document details by ID.
    """
    doc = db.query(SourceDocument).filter(SourceDocument.id == document_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document with ID '{document_id}' not found."
        )
    return doc
