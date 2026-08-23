from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DocumentBase(BaseModel):
    filename: str
    file_size: int
    mime_type: str = "application/pdf"

class DocumentCreate(DocumentBase):
    file_path: str

class DocumentResponse(DocumentBase):
    id: str
    uploaded_at: datetime

    model_config = ConfigDict(from_attributes=True)
