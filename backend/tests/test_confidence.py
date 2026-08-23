import pytest
from app.db.models import TrustStatus, KnowledgeType
from app.pipeline.confidence import TrustConfidenceEngine, ProductHealthScore

def test_confidence_formula_exact_match():
    doc_text = "Material Specification: Grade SS304 Stainless Steel"
    result = TrustConfidenceEngine.calculate_confidence(
        raw_value="SS304",
        normalized_value="Stainless Steel 304",
        quoted_evidence="Material Specification: Grade SS304 Stainless Steel",
        document_text=doc_text,
        validation_passed=True,
        knowledge_type=KnowledgeType.NORMALIZED_FACT,
        has_conflict=False,
        known_lookup_match=True
    )

    assert result.confidence >= 0.90
    assert result.evidence_exactness == 1.0
    assert result.schema_validity == 1.0
    assert result.source_agreement == 1.0
    assert result.known_value_match == 1.0
    assert result.trust_status == TrustStatus.VERIFIED

def test_confidence_formula_conflict_state():
    doc_text = "Material Specification: Grade SS304 Stainless Steel"
    result = TrustConfidenceEngine.calculate_confidence(
        raw_value="SS304",
        normalized_value="Stainless Steel 304",
        quoted_evidence="Material Specification: Grade SS304 Stainless Steel",
        document_text=doc_text,
        validation_passed=True,
        knowledge_type=KnowledgeType.EXPLICIT_FACT,
        has_conflict=True,
        known_lookup_match=True
    )

    assert result.source_agreement == 0.0
    assert result.trust_status == TrustStatus.CONFLICT

def test_trust_status_classification_inferred():
    result = TrustConfidenceEngine.calculate_confidence(
        raw_value="DIN 933",
        normalized_value="DIN 933",
        quoted_evidence=None,
        document_text="Sample Catalog Page",
        validation_passed=True,
        knowledge_type=KnowledgeType.INFERRED_INFO,
        has_conflict=False
    )

    assert result.trust_status == TrustStatus.NEEDS_REVIEW

def test_product_health_score_calculation():
    attrs = [
        {
            "name": "Material",
            "raw_value": "SS304",
            "normalized_value": "Stainless Steel 304",
            "confidence": 0.95,
            "trust_status": TrustStatus.VERIFIED,
            "evidence": {"text_quote": "Material Specification: Grade SS304 Stainless Steel"}
        },
        {
            "name": "Thread Diameter",
            "raw_value": "M10",
            "normalized_value": "M10",
            "confidence": 0.92,
            "trust_status": TrustStatus.VERIFIED,
            "evidence": {"text_quote": "Nominal Thread Diameter (d): 10 mm (M10)"}
        },
        {
            "name": "Length",
            "raw_value": "50",
            "normalized_value": "50",
            "confidence": 0.85,
            "trust_status": TrustStatus.HIGH_CONFIDENCE,
            "evidence": {"text_quote": "Overall Length (L): 50 mm"}
        }
    ]

    health = TrustConfidenceEngine.calculate_product_health(attrs, expected_target_attributes=4)
    assert isinstance(health, ProductHealthScore)
    assert health.overall_score > 60.0
    assert health.total_attributes == 3
    assert health.review_required_count == 0
    assert health.conflict_count == 0
