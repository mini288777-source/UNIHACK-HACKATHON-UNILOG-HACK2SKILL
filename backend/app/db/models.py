import uuid
from datetime import datetime, timezone
import enum
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Enum as SQLEnum, JSON
)
from sqlalchemy.orm import relationship
from app.db.base import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class KnowledgeType(str, enum.Enum):
    EXPLICIT_FACT = "EXPLICIT_FACT"
    NORMALIZED_FACT = "NORMALIZED_FACT"
    DERIVED_INFO = "DERIVED_INFO"
    INFERRED_INFO = "INFERRED_INFO"

class TrustStatus(str, enum.Enum):
    VERIFIED = "VERIFIED"
    HIGH_CONFIDENCE = "HIGH_CONFIDENCE"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    CONFLICT = "CONFLICT"
    UNKNOWN = "UNKNOWN"

class SourceDocument(Base):
    __tablename__ = "source_documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), default="application/pdf")
    uploaded_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    jobs = relationship("ProcessingJob", back_populates="document", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="document")
    evidence = relationship("Evidence", back_populates="document")

class ProcessingJob(Base):
    __tablename__ = "processing_jobs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("source_documents.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(50), default="PENDING")  # PENDING, PROCESSING, COMPLETED, FAILED
    current_stage = Column(String(50), default="PENDING")  # INGESTING, PARSING, EXTRACTING, NORMALIZING, VALIDATING, PERSISTING
    progress_pct = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    document = relationship("SourceDocument", back_populates="jobs")

class Product(Base):
    __tablename__ = "products"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("source_documents.id"), nullable=True)
    name = Column(String(255), nullable=False)
    category = Column(String(255), nullable=True)
    manufacturer = Column(String(255), nullable=True)
    sku = Column(String(100), nullable=True)
    health_score = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    document = relationship("SourceDocument", back_populates="products")
    attributes = relationship("ProductAttribute", back_populates="product", cascade="all, delete-orphan")
    conflicts = relationship("Conflict", back_populates="product", cascade="all, delete-orphan")

class ProductAttribute(Base):
    __tablename__ = "product_attributes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    raw_value = Column(Text, nullable=True)
    normalized_value = Column(Text, nullable=True)
    unit = Column(String(50), nullable=True)
    knowledge_type = Column(SQLEnum(KnowledgeType), default=KnowledgeType.EXPLICIT_FACT)
    trust_status = Column(SQLEnum(TrustStatus), default=TrustStatus.NEEDS_REVIEW)
    confidence = Column(Float, default=0.0)
    is_inferred = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    product = relationship("Product", back_populates="attributes")
    evidence = relationship("Evidence", back_populates="attribute", uselist=False, cascade="all, delete-orphan")

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    attribute_id = Column(String(36), ForeignKey("product_attributes.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("source_documents.id"), nullable=False)
    page_number = Column(Integer, default=1)
    text_quote = Column(Text, nullable=False)
    bounding_box = Column(JSON, nullable=True)
    confidence_breakdown = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    attribute = relationship("ProductAttribute", back_populates="evidence")
    document = relationship("SourceDocument", back_populates="evidence")

class Conflict(Base):
    __tablename__ = "conflicts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_name = Column(String(100), nullable=False)
    doc1_id = Column(String(36), ForeignKey("source_documents.id"), nullable=True)
    doc1_value = Column(Text, nullable=True)
    doc2_id = Column(String(36), ForeignKey("source_documents.id"), nullable=True)
    doc2_value = Column(Text, nullable=True)
    status = Column(String(50), default="UNRESOLVED")  # UNRESOLVED, RESOLVED, IGNORED
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationship
    product = relationship("Product", back_populates="conflicts")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    product_id = Column(String(36), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    attribute_id = Column(String(36), ForeignKey("product_attributes.id", ondelete="CASCADE"), nullable=True)
    action = Column(String(100), nullable=False)
    previous_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    user_id = Column(String(100), default="SysAdmin_04")
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Relationships
    product = relationship("Product")
    attribute = relationship("ProductAttribute")
