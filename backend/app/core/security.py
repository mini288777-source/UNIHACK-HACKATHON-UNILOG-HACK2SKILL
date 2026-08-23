import os
import uuid
import re
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIME_TYPES = {"application/pdf", "image/png", "image/jpeg"}

def sanitize_filename(filename: str) -> str:
    """
    Sanitizes user filename to prevent path traversal or unsafe characters.
    """
    # Remove directory paths if present
    base_name = os.path.basename(filename)
    # Remove non-alphanumeric characters except dot, dash, underscore
    clean_name = re.sub(r"[^a-zA-Z0-9._-]", "_", base_name)
    return clean_name

def validate_upload_file(file: UploadFile) -> str:
    """
    Validates uploaded file extension, MIME type, and generates a unique storage path.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file has no filename."
        )

    clean_name = sanitize_filename(file.filename)
    _, ext = os.path.splitext(clean_name)
    ext = ext.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file extension '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported MIME type '{file.content_type}'."
        )

    # Generate unique UUID storage filename
    unique_id = str(uuid.uuid4())
    stored_filename = f"{unique_id}{ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    return file_path

def sanitize_prompt_content(raw_text: str) -> str:
    """
    Wraps document text blocks in untrusted XML tags to prevent prompt injection.
    """
    cleaned = raw_text.replace("<untrusted_document_content>", "").replace("</untrusted_document_content>", "")
    return f"<untrusted_document_content>\n{cleaned}\n</untrusted_document_content>"
