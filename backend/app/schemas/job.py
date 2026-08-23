from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class JobBase(BaseModel):
    document_id: str
    status: str = "PENDING"
    current_stage: str = "PENDING"
    progress_pct: float = 0.0

class JobCreate(JobBase):
    pass

class JobResponse(JobBase):
    id: str
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
