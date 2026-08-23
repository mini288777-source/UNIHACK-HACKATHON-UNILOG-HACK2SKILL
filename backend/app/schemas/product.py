from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from app.db.models import KnowledgeType, TrustStatus

class ConfidenceBreakdown(BaseModel):
    evidence_exactness: float = 0.0
    schema_validity: float = 0.0
    source_agreement: float = 0.0
    known_value_match: float = 0.0

class EvidenceResponse(BaseModel):
    id: str
    document_id: str
    page_number: int
    text_quote: str
    bounding_box: Optional[Dict[str, Any]] = None
    confidence_breakdown: Optional[Dict[str, float]] = None

    model_config = ConfigDict(from_attributes=True)

class AttributeBase(BaseModel):
    name: str
    raw_value: Optional[str] = None
    normalized_value: Optional[str] = None
    unit: Optional[str] = None
    knowledge_type: KnowledgeType = KnowledgeType.EXPLICIT_FACT
    trust_status: TrustStatus = TrustStatus.NEEDS_REVIEW
    confidence: float = 0.0
    is_inferred: bool = False

class AttributeUpdate(BaseModel):
    normalized_value: Optional[str] = None
    trust_status: Optional[TrustStatus] = None
    knowledge_type: Optional[KnowledgeType] = None

class AttributeResponse(AttributeBase):
    id: str
    product_id: str
    evidence: Optional[EvidenceResponse] = None

    model_config = ConfigDict(from_attributes=True)

class ConflictResponse(BaseModel):
    id: str
    product_id: str
    attribute_name: str
    doc1_id: Optional[str] = None
    doc1_value: Optional[str] = None
    doc2_id: Optional[str] = None
    doc2_value: Optional[str] = None
    status: str = "UNRESOLVED"

    model_config = ConfigDict(from_attributes=True)

class ProductBase(BaseModel):
    name: str
    category: Optional[str] = None
    manufacturer: Optional[str] = None
    sku: Optional[str] = None

class ProductResponse(ProductBase):
    id: str
    document_id: Optional[str] = None
    health_score: float = 0.0
    created_at: datetime
    updated_at: datetime
    attributes: List[AttributeResponse] = []
    conflicts: List[ConflictResponse] = []

    model_config = ConfigDict(from_attributes=True)
