from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from app.db.session import get_db
from app.db.models import Product, ProductAttribute, Conflict
from app.schemas.product import ProductResponse, AttributeResponse, AttributeUpdate, ConflictResponse
from app.pipeline.confidence import TrustConfidenceEngine

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
def list_products(
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db)
):
    """
    Lists processed product intelligence records with health scores and attributes.
    Uses selectinload for high-performance single-batch querying.
    """
    products = (
        db.query(Product)
        .options(
            selectinload(Product.attributes).selectinload(ProductAttribute.evidence),
            selectinload(Product.conflicts)
        )
        .offset(skip)
        .limit(limit)
        .all()
    )
    return products

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: str, db: Session = Depends(get_db)):
    """
    Fetches full product intelligence record by ID including attributes, evidence, and conflicts.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID '{product_id}' not found."
        )
    return product

@router.patch("/{product_id}/attributes/{attribute_id}", response_model=AttributeResponse)
def update_product_attribute(
    product_id: str,
    attribute_id: str,
    payload: AttributeUpdate,
    db: Session = Depends(get_db)
):
    """
    Manually edits attribute normalized value, trust status, or knowledge type, and recalculates product health score.
    """
    attribute = db.query(ProductAttribute).filter(
        ProductAttribute.id == attribute_id,
        ProductAttribute.product_id == product_id
    ).first()

    if not attribute:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attribute '{attribute_id}' for product '{product_id}' not found."
        )

    prev_val = attribute.normalized_value

    if payload.normalized_value is not None:
        attribute.normalized_value = payload.normalized_value.strip()

    if payload.trust_status is not None:
        attribute.trust_status = payload.trust_status

    if payload.knowledge_type is not None:
        attribute.knowledge_type = payload.knowledge_type

    # Create auditable AuditLog record
    from app.db.models import AuditLog
    audit_entry = AuditLog(
        product_id=product_id,
        attribute_id=attribute_id,
        action="MANUAL_OVERRIDE_ATTRIBUTE",
        previous_value=prev_val,
        new_value=attribute.normalized_value,
        user_id="SysAdmin_04"
    )
    db.add(audit_entry)

    db.commit()
    db.refresh(attribute)

    # Recalculate Product Data Health Score
    product = db.query(Product).filter(Product.id == product_id).first()
    if product:
        attrs_data = [
            {
                "name": a.name,
                "raw_value": a.raw_value,
                "normalized_value": a.normalized_value,
                "confidence": a.confidence,
                "trust_status": a.trust_status,
                "evidence": {"text_quote": a.evidence.text_quote} if a.evidence else None
            }
            for a in product.attributes
        ]
        health_res = TrustConfidenceEngine.calculate_product_health(attrs_data)
        product.health_score = health_res.overall_score
        db.commit()

    return attribute

@router.get("/{product_id}/conflicts", response_model=List[ConflictResponse])
def get_product_conflicts(product_id: str, db: Session = Depends(get_db)):
    """
    Fetches conflicting attribute records for a product across documents.
    """
    conflicts = db.query(Conflict).filter(Conflict.product_id == product_id).all()
    return conflicts

@router.get("/{product_id}/export")
def export_product_alias(
    product_id: str,
    format: str = "json",
    db: Session = Depends(get_db)
):
    """
    Direct product export endpoint for JSON/CSV/Delivery Format.
    """
    from app.api.v1.endpoints.export import export_product_data
    return export_product_data(product_id=product_id, format=format, db=db)


@router.delete("", status_code=status.HTTP_200_OK)
@router.post("/reset", status_code=status.HTTP_200_OK)
def clear_all_products(db: Session = Depends(get_db)):
    """
    Direct endpoint to wipe all product records, documents, jobs, and audit history.
    """
    from app.api.v1.endpoints.enrichment import reset_entire_database
    return reset_entire_database(db=db)
