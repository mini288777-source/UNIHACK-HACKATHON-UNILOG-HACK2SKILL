import os
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import Product, ProductAttribute, TrustStatus
from app.pipeline.csv_enricher import CSVEnricher
from app.pipeline.evaluator import PipelineEvaluator

router = APIRouter(prefix="/enrich", tags=["Enrichment"])


@router.post("/csv")
async def enrich_csv_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Ingests and dynamically enriches raw catalog CSV dataset (e.g. Unihack_ Sample Dataset - Input.csv).
    Returns enriched SKU count and summary records.
    """
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files (.csv) are supported for catalog batch enrichment."
        )

    content = await file.read()
    try:
        csv_text = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_text = content.decode("latin-1")

    count, records = CSVEnricher.enrich_csv_stream(csv_text, db)

    return {
        "status": "SUCCESS",
        "enriched_sku_count": count,
        "processed_records": records[:20],
        "message": f"Successfully enriched {count} SKUs into structured product intelligence with health scores."
    }


@router.get("/metrics")
def get_catalog_enrichment_metrics(db: Session = Depends(get_db)):
    """
    Provides real-time product intelligence metrics and quality health distribution.
    """
    total_products = db.query(Product).count()
    if total_products == 0:
        return {
            "total_products": 0,
            "average_health_score": 0.0,
            "verified_attributes_count": 0,
            "review_required_count": 0,
            "category_distribution": {},
            "trust_status_breakdown": {
                "VERIFIED": 0,
                "HIGH_CONFIDENCE": 0,
                "NEEDS_REVIEW": 0,
                "CONFLICT": 0
            }
        }

    products = db.query(Product).all()
    avg_health = sum(p.health_score or 0 for p in products) / total_products

    # Category distribution
    cat_dist = {}
    for p in products:
        cat_key = p.category.split(">")[-1] if p.category and ">" in p.category else (p.category or "General")
        cat_dist[cat_key] = cat_dist.get(cat_key, 0) + 1

    # Attribute trust status counts
    total_attrs = db.query(ProductAttribute).count()
    verified_count = db.query(ProductAttribute).filter(ProductAttribute.trust_status == TrustStatus.VERIFIED).count()
    high_conf_count = db.query(ProductAttribute).filter(ProductAttribute.trust_status == TrustStatus.HIGH_CONFIDENCE).count()
    needs_review_count = db.query(ProductAttribute).filter(ProductAttribute.trust_status == TrustStatus.NEEDS_REVIEW).count()
    conflict_count = db.query(ProductAttribute).filter(ProductAttribute.trust_status == TrustStatus.CONFLICT).count()

    return {
        "total_products": total_products,
        "average_health_score": round(avg_health, 1),
        "total_attributes": total_attrs,
        "verified_attributes_count": verified_count,
        "review_required_count": needs_review_count,
        "category_distribution": cat_dist,
        "trust_status_breakdown": {
            "VERIFIED": verified_count,
            "HIGH_CONFIDENCE": high_conf_count,
            "NEEDS_REVIEW": needs_review_count,
            "CONFLICT": conflict_count
        }
    }


@router.get("/evaluate")
def run_ground_truth_evaluation():
    """
    Executes automated field-level benchmarking against the official UniHack Ground Truth dataset.
    """
    curr = os.path.abspath(__file__)
    sample_dir = None
    for _ in range(8):
        curr = os.path.dirname(curr)
        candidate = os.path.join(curr, "SAMPLE DATASET AND SAMPLE OUTPUT")
        if os.path.exists(candidate):
            sample_dir = candidate
            break

    if not sample_dir:
        return {
            "status": "ERROR",
            "message": "Ground truth dataset directory not found."
        }

    gt_path = os.path.join(sample_dir, "Unihack_ Expected Output - Delivery Format.csv")
    input_path = os.path.join(sample_dir, "Unihack_ Sample Dataset - Input.csv")

    if not os.path.exists(gt_path) or not os.path.exists(input_path):
        return {
            "status": "ERROR",
            "message": "Ground truth dataset files not found at expected location."
        }

    results = PipelineEvaluator.evaluate_ground_truth(gt_path, input_path)
    return results


@router.post("/reset")
def reset_entire_database(db: Session = Depends(get_db)):
    """
    Completely purges all records across products, attributes, evidence, conflicts, audit logs, documents, and jobs.
    Also clears any temporary uploaded files. Returns clean status.
    """
    from app.db.models import Conflict, Evidence, ProductAttribute, Product, SourceDocument, ProcessingJob, AuditLog
    from app.core.config import settings

    try:
        db.query(AuditLog).delete()
        db.query(Conflict).delete()
        db.query(Evidence).delete()
        db.query(ProductAttribute).delete()
        db.query(Product).delete()
        db.query(ProcessingJob).delete()
        db.query(SourceDocument).delete()
        db.commit()

        # Clean temporary files in uploads directory (keep .gitkeep)
        if os.path.exists(settings.UPLOAD_DIR):
            for fname in os.listdir(settings.UPLOAD_DIR):
                if fname != ".gitkeep":
                    fpath = os.path.join(settings.UPLOAD_DIR, fname)
                    try:
                        if os.path.isfile(fpath) or os.path.islink(fpath):
                            os.remove(fpath)
                    except Exception:
                        pass
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset database: {str(e)}"
        )

    return {
        "status": "SUCCESS",
        "message": "Database and temporary artifacts successfully wiped clean. 0 records remaining."
    }

