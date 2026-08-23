import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.db.models import Product, ProductAttribute, Conflict, TrustStatus

logger = logging.getLogger("unilogger.conflict")

class ConflictDetector:
    @staticmethod
    def detect_and_record_conflicts(
        db: Session,
        product_id: str,
        current_doc_id: str,
        extracted_attributes: List[Dict[str, Any]]
    ) -> List[Conflict]:
        """
        Compares extracted product attributes against existing attributes for the same product name/SKU.
        Creates Conflict records if discrepancies exist.
        """
        conflicts_created: List[Conflict] = []
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            return conflicts_created

        # Find other products with matching SKU or normalized product name
        query = db.query(Product).filter(Product.id != product_id)
        if product.sku:
            other_products = query.filter(Product.sku == product.sku).all()
        else:
            other_products = query.filter(Product.name == product.name).all()

        if not other_products:
            return conflicts_created

        # Compare attribute by attribute
        for attr in extracted_attributes:
            attr_name = attr.get("name")
            norm_val = attr.get("normalized_value") or attr.get("raw_value")

            if not attr_name or not norm_val:
                continue

            for other_prod in other_products:
                for existing_attr in other_prod.attributes:
                    if existing_attr.name.lower() == attr_name.lower():
                        existing_val = existing_attr.normalized_value or existing_attr.raw_value
                        if existing_val and existing_val.strip().lower() != norm_val.strip().lower():
                            # Conflict detected!
                            logger.info(f"Conflict detected for '{attr_name}': '{norm_val}' vs '{existing_val}'")
                            conflict = Conflict(
                                product_id=product_id,
                                attribute_name=attr_name,
                                doc1_id=current_doc_id,
                                doc1_value=norm_val,
                                doc2_id=existing_attr.evidence.document_id if existing_attr.evidence else other_prod.document_id,
                                doc2_value=existing_val,
                                status="UNRESOLVED"
                            )
                            db.add(conflict)
                            conflicts_created.append(conflict)
                            attr["trust_status"] = TrustStatus.CONFLICT

        if conflicts_created:
            db.commit()

        return conflicts_created
