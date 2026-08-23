from typing import Dict, Any, List, Optional, Tuple
from pydantic import BaseModel
from app.db.models import TrustStatus, KnowledgeType

class ConfidenceResult(BaseModel):
    confidence: float
    evidence_exactness: float
    schema_validity: float
    source_agreement: float
    known_value_match: float
    trust_status: TrustStatus

class ProductHealthScore(BaseModel):
    overall_score: float  # 0.0 to 100.0
    completeness_score: float
    evidence_coverage_score: float
    validation_score: float
    avg_confidence_score: float
    total_attributes: int
    review_required_count: int
    conflict_count: int

class TrustConfidenceEngine:
    # Formula Weight Constants
    WEIGHT_EVIDENCE = 0.35
    WEIGHT_SCHEMA = 0.25
    WEIGHT_AGREEMENT = 0.20
    WEIGHT_LOOKUP = 0.20

    @staticmethod
    def calculate_confidence(
        raw_value: str,
        normalized_value: str,
        quoted_evidence: Optional[str],
        document_text: str,
        validation_passed: bool,
        knowledge_type: KnowledgeType,
        has_conflict: bool = False,
        known_lookup_match: bool = True
    ) -> ConfidenceResult:
        """
        Calculates attribute confidence (0.00 to 1.00) using a 4-factor deterministic mathematical formula.
        """
        # 1. Factor 1: Evidence Exactness (0.0 to 1.0)
        evidence_exactness = 0.0
        if quoted_evidence and quoted_evidence.strip():
            quote_clean = quoted_evidence.strip()
            if quote_clean in document_text:
                evidence_exactness = 1.0
            elif raw_value and raw_value in document_text:
                evidence_exactness = 0.8
            else:
                evidence_exactness = 0.5
        elif raw_value and raw_value in document_text:
            evidence_exactness = 0.7

        # 2. Factor 2: Schema & Rule Validity (0.0 or 1.0)
        schema_validity = 1.0 if validation_passed else 0.0

        # 3. Factor 3: Source Agreement (0.0 or 1.0)
        source_agreement = 0.0 if has_conflict else 1.0

        # 4. Factor 4: Known Value Lookup Match (0.0, 0.5, or 1.0)
        if known_lookup_match:
            known_value_match = 1.0
        elif knowledge_type in [KnowledgeType.NORMALIZED_FACT, KnowledgeType.EXPLICIT_FACT]:
            known_value_match = 0.8
        elif knowledge_type == KnowledgeType.DERIVED_INFO:
            known_value_match = 0.7
        else:
            known_value_match = 0.4

        # Calculate Weighted Mathematical Confidence Score
        confidence = (
            TrustConfidenceEngine.WEIGHT_EVIDENCE * evidence_exactness +
            TrustConfidenceEngine.WEIGHT_SCHEMA * schema_validity +
            TrustConfidenceEngine.WEIGHT_AGREEMENT * source_agreement +
            TrustConfidenceEngine.WEIGHT_LOOKUP * known_value_match
        )

        confidence = round(max(0.0, min(1.0, confidence)), 2)

        # Determine 5-State Trust Status
        trust_status = TrustConfidenceEngine.determine_trust_status(
            confidence=confidence,
            knowledge_type=knowledge_type,
            validation_passed=validation_passed,
            has_conflict=has_conflict,
            has_evidence=bool(quoted_evidence and quoted_evidence.strip())
        )

        return ConfidenceResult(
            confidence=confidence,
            evidence_exactness=evidence_exactness,
            schema_validity=schema_validity,
            source_agreement=source_agreement,
            known_value_match=known_value_match,
            trust_status=trust_status
        )

    @staticmethod
    def determine_trust_status(
        confidence: float,
        knowledge_type: KnowledgeType,
        validation_passed: bool,
        has_conflict: bool,
        has_evidence: bool
    ) -> TrustStatus:
        """
        Classifies attribute into one of 5 Trust Statuses:
        VERIFIED 🟢, HIGH_CONFIDENCE 🟡, NEEDS_REVIEW 🟠, CONFLICT 🔴, UNKNOWN ⚪
        """
        if has_conflict:
            return TrustStatus.CONFLICT

        if not has_evidence and confidence < 0.50:
            return TrustStatus.UNKNOWN

        if not validation_passed:
            return TrustStatus.NEEDS_REVIEW

        if knowledge_type == KnowledgeType.INFERRED_INFO:
            return TrustStatus.NEEDS_REVIEW

        if confidence >= 0.90 and validation_passed and (knowledge_type in [KnowledgeType.EXPLICIT_FACT, KnowledgeType.NORMALIZED_FACT]):
            return TrustStatus.VERIFIED

        if confidence >= 0.75:
            return TrustStatus.HIGH_CONFIDENCE

        if confidence >= 0.50:
            return TrustStatus.NEEDS_REVIEW

        return TrustStatus.UNKNOWN

    @staticmethod
    def calculate_product_health(attributes: List[Dict[str, Any]], expected_target_attributes: int = 7) -> ProductHealthScore:
        """
        Computes Product Data Health Score (0.0 to 100.0%) based on completeness, evidence, validation & confidence.
        """
        if not attributes:
            return ProductHealthScore(
                overall_score=0.0,
                completeness_score=0.0,
                evidence_coverage_score=0.0,
                validation_score=0.0,
                avg_confidence_score=0.0,
                total_attributes=0,
                review_required_count=0,
                conflict_count=0
            )

        total_attrs = len(attributes)
        
        # 1. Completeness Score (0 - 100%)
        populated_count = sum(1 for a in attributes if a.get("normalized_value") or a.get("raw_value"))
        completeness = min(100.0, (populated_count / max(1, expected_target_attributes)) * 100.0)

        # 2. Evidence Coverage Score (0 - 100%)
        evidence_count = sum(1 for a in attributes if a.get("evidence") and a["evidence"].get("text_quote"))
        evidence_coverage = (evidence_count / max(1, total_attrs)) * 100.0

        # 3. Validation Rate (0 - 100%)
        valid_count = sum(1 for a in attributes if a.get("trust_status") in [TrustStatus.VERIFIED, TrustStatus.HIGH_CONFIDENCE])
        validation_rate = (valid_count / max(1, total_attrs)) * 100.0

        # 4. Average Confidence (0 - 100%)
        avg_conf = (sum(float(a.get("confidence", 0.0)) for a in attributes) / max(1, total_attrs)) * 100.0

        # Count flagged items
        review_count = sum(1 for a in attributes if a.get("trust_status") == TrustStatus.NEEDS_REVIEW)
        conflict_count = sum(1 for a in attributes if a.get("trust_status") == TrustStatus.CONFLICT)

        # Overall Health Formula Weighted Blend
        overall = (
            0.30 * completeness +
            0.30 * evidence_coverage +
            0.20 * validation_rate +
            0.20 * avg_conf
        )

        return ProductHealthScore(
            overall_score=round(max(0.0, min(100.0, overall)), 1),
            completeness_score=round(completeness, 1),
            evidence_coverage_score=round(evidence_coverage, 1),
            validation_score=round(validation_rate, 1),
            avg_confidence_score=round(avg_conf, 1),
            total_attributes=total_attrs,
            review_required_count=review_count,
            conflict_count=conflict_count
        )
