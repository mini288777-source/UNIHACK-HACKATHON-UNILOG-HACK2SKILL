import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session

from app.db.models import SourceDocument, ProcessingJob, Product, ProductAttribute, Evidence
from app.pipeline.ingestion import PDFIngestionEngine
from app.pipeline.llm_extractor import LLMExtractionPipeline
from app.pipeline.normalizer import FastenerNormalizer
from app.pipeline.validator import FastenerValidator
from app.pipeline.confidence import TrustConfidenceEngine
from app.pipeline.conflict import ConflictDetector

logger = logging.getLogger("unilogger.orchestrator")

class PipelineOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.ingestion_engine = PDFIngestionEngine()
        self.llm_pipeline = LLMExtractionPipeline()

    def run_pipeline_job(self, job_id: str):
        """
        Executes end-to-end processing pipeline for a given job_id.
        """
        job = self.db.query(ProcessingJob).filter(ProcessingJob.id == job_id).first()
        if not job:
            logger.error(f"Job ID '{job_id}' not found.")
            return

        doc = self.db.query(SourceDocument).filter(SourceDocument.id == job.document_id).first()
        if not doc:
            logger.error(f"SourceDocument '{job.document_id}' not found for job '{job_id}'.")
            job.status = "FAILED"
            job.error_message = "Source document file record not found."
            self.db.commit()
            return

        try:
            # Stage 1: Ingestion & Text/Table Parsing
            logger.info(f"Stage 1 [PARSING] - Document '{doc.filename}'")
            job.status = "PROCESSING"
            job.current_stage = "PARSING"
            job.progress_pct = 20.0
            self.db.commit()

            extracted_doc = self.ingestion_engine.extract_document(doc.file_path)

            # Stage 2: Schema-Enforced LLM Extraction
            logger.info(f"Stage 2 [EXTRACTING] - Document '{doc.filename}'")
            job.current_stage = "EXTRACTING"
            job.progress_pct = 40.0
            self.db.commit()

            raw_response = self.llm_pipeline.extract_from_document(extracted_doc)

            # Stage 3: Normalization, Validation, Confidence & Persistence
            logger.info(f"Stage 3 [NORMALIZING & VALIDATING] - {len(raw_response.products)} products extracted")
            job.current_stage = "NORMALIZING"
            job.progress_pct = 60.0
            self.db.commit()

            for raw_prod in raw_response.products:
                product = Product(
                    document_id=doc.id,
                    name=raw_prod.product_name,
                    category=raw_prod.category,
                    manufacturer=raw_prod.manufacturer,
                    sku=raw_prod.sku_model
                )
                self.db.add(product)
                self.db.commit()
                self.db.refresh(product)

                processed_attrs_list = []
                attr_map_for_validation = {}

                # Process each extracted attribute
                for raw_attr in raw_prod.attributes:
                    norm_val, norm_unit, knowledge_type = FastenerNormalizer.normalize_attribute(
                        name=raw_attr.name,
                        raw_value=raw_attr.raw_value,
                        raw_unit=raw_attr.unit,
                        is_inferred=raw_attr.is_inferred
                    )

                    attr_map_for_validation[raw_attr.name] = norm_val or raw_attr.raw_value

                    processed_attrs_list.append({
                        "name": raw_attr.name,
                        "raw_value": raw_attr.raw_value,
                        "normalized_value": norm_val,
                        "unit": norm_unit or raw_attr.unit,
                        "knowledge_type": knowledge_type,
                        "is_inferred": raw_attr.is_inferred,
                        "quoted_evidence": raw_attr.quoted_evidence,
                        "page_number": raw_attr.page_number
                    })

                # Stage 4: Run Fastener Domain Validation Rules
                job.current_stage = "VALIDATING"
                job.progress_pct = 80.0
                self.db.commit()

                validation_results = FastenerValidator.validate_attributes(attr_map_for_validation)
                all_validation_passed = all(v.passed for v in validation_results) if validation_results else True

                # Stage 5: Conflict Detection & Confidence Scoring
                ConflictDetector.detect_and_record_conflicts(
                    db=self.db,
                    product_id=product.id,
                    current_doc_id=doc.id,
                    extracted_attributes=processed_attrs_list
                )

                created_attrs_data = []

                for attr_item in processed_attrs_list:
                    # Calculate deterministic confidence
                    conf_res = TrustConfidenceEngine.calculate_confidence(
                        raw_value=attr_item["raw_value"],
                        normalized_value=attr_item["normalized_value"],
                        quoted_evidence=attr_item["quoted_evidence"],
                        document_text=extracted_doc.full_text,
                        validation_passed=all_validation_passed,
                        knowledge_type=attr_item["knowledge_type"],
                        has_conflict=(attr_item.get("trust_status") == "CONFLICT"),
                        known_lookup_match=all_validation_passed
                    )

                    attribute = ProductAttribute(
                        product_id=product.id,
                        name=attr_item["name"],
                        raw_value=attr_item["raw_value"],
                        normalized_value=attr_item["normalized_value"],
                        unit=attr_item["unit"],
                        knowledge_type=attr_item["knowledge_type"],
                        trust_status=conf_res.trust_status,
                        confidence=conf_res.confidence,
                        is_inferred=attr_item["is_inferred"]
                    )
                    self.db.add(attribute)
                    self.db.commit()
                    self.db.refresh(attribute)

                    # Persist Evidence
                    evidence = Evidence(
                        attribute_id=attribute.id,
                        document_id=doc.id,
                        page_number=attr_item["page_number"],
                        text_quote=attr_item["quoted_evidence"],
                        confidence_breakdown={
                            "evidence_exactness": conf_res.evidence_exactness,
                            "schema_validity": conf_res.schema_validity,
                            "source_agreement": conf_res.source_agreement,
                            "known_value_match": conf_res.known_value_match
                        }
                    )
                    self.db.add(evidence)

                    created_attrs_data.append({
                        "name": attribute.name,
                        "raw_value": attribute.raw_value,
                        "normalized_value": attribute.normalized_value,
                        "confidence": attribute.confidence,
                        "trust_status": attribute.trust_status,
                        "evidence": {"text_quote": evidence.text_quote}
                    })

                # Compute and update Product Data Health Score
                health_res = TrustConfidenceEngine.calculate_product_health(created_attrs_data)
                product.health_score = health_res.overall_score
                self.db.commit()

            # Stage 6: Job Complete
            job.status = "COMPLETED"
            job.current_stage = "PERSISTING"
            job.progress_pct = 100.0
            job.completed_at = datetime.now(timezone.utc)
            self.db.commit()
            logger.info(f"Pipeline job '{job_id}' successfully COMPLETED.")

        except Exception as err:
            logger.exception(f"Pipeline failed for job '{job_id}': {err}")
            job.status = "FAILED"
            job.error_message = str(err)
            self.db.commit()

def run_orchestrator_background_task(job_id: str, db_session_factory):
    """
    Background worker entry point for FastAPI BackgroundTasks.
    """
    db = db_session_factory()
    try:
        orchestrator = PipelineOrchestrator(db)
        orchestrator.run_pipeline_job(job_id)
    finally:
        db.close()
