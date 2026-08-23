import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class ValidationRuleResult(BaseModel):
    rule_name: str
    passed: bool
    message: str
    severity: str = "ERROR"  # ERROR, WARNING, INFO

# Standard Metric Coarse Thread Pitch Lookups
METRIC_COARSE_PITCH_MAP: Dict[str, float] = {
    "M3": 0.5,
    "M4": 0.7,
    "M5": 0.8,
    "M6": 1.0,
    "M8": 1.25,
    "M10": 1.5,
    "M12": 1.75,
    "M14": 2.0,
    "M16": 2.0,
    "M20": 2.5,
    "M24": 3.0,
    "M30": 3.5,
}

# Standard Metric Fine Thread Pitch Options
METRIC_FINE_PITCH_MAP: Dict[str, List[float]] = {
    "M8": [1.0],
    "M10": [1.0, 1.25],
    "M12": [1.25, 1.5],
    "M14": [1.5],
    "M16": [1.5],
    "M20": [1.5, 2.0],
}

class FastenerValidator:
    @staticmethod
    def validate_attributes(attributes: Dict[str, str]) -> List[ValidationRuleResult]:
        """
        Executes fastener domain validation rules against extracted/normalized attribute map.
        """
        results: List[ValidationRuleResult] = []

        # Extract normalized field values for rule execution
        thread_dia = attributes.get("Thread Diameter") or attributes.get("Diameter") or attributes.get("Size")
        pitch_str = attributes.get("Thread Pitch") or attributes.get("Pitch")
        material = attributes.get("Material")
        grade = attributes.get("Grade") or attributes.get("Property Class")
        standard = attributes.get("Standard")
        length_str = attributes.get("Length")

        # RULE 1: Thread Diameter & Pitch Validation
        if thread_dia and pitch_str:
            results.append(FastenerValidator._validate_thread_pitch(thread_dia, pitch_str))

        # RULE 2: Material & Property Class Compatibility
        if material and grade:
            results.append(FastenerValidator._validate_material_grade(material, grade))

        # RULE 3: Standard & Product Designation Alignment
        if standard:
            results.append(FastenerValidator._validate_standard_format(standard))

        # RULE 4: Positive Dimension Sanity Check
        if length_str:
            results.append(FastenerValidator._validate_length_bounds(length_str))

        return [r for r in results if r is not None]

    @staticmethod
    def _validate_thread_pitch(diameter_str: str, pitch_str: str) -> ValidationRuleResult:
        # Extract M-size (e.g. M10, 10mm -> M10)
        m_match = re.search(r"M\d+", diameter_str.upper())
        m_size = m_match.group() if m_match else None

        if not m_size:
            num_match = re.search(r"\d+", diameter_str)
            if num_match:
                m_size = f"M{num_match.group()}"

        try:
            pitch_val = float(re.search(r"[-+]?\d*\.\d+|\d+", pitch_str).group())
        except Exception:
            return ValidationRuleResult(
                rule_name="thread_pitch_validity",
                passed=False,
                message=f"Thread pitch '{pitch_str}' could not be parsed as a numeric value.",
                severity="WARNING"
            )

        if m_size and m_size in METRIC_COARSE_PITCH_MAP:
            coarse_pitch = METRIC_COARSE_PITCH_MAP[m_size]
            fine_pitches = METRIC_FINE_PITCH_MAP.get(m_size, [])

            if abs(pitch_val - coarse_pitch) < 0.05:
                return ValidationRuleResult(
                    rule_name="thread_pitch_validity",
                    passed=True,
                    message=f"Pitch {pitch_val}mm matches standard coarse thread pitch for {m_size}.",
                    severity="INFO"
                )
            elif any(abs(pitch_val - fp) < 0.05 for fp in fine_pitches):
                return ValidationRuleResult(
                    rule_name="thread_pitch_validity",
                    passed=True,
                    message=f"Pitch {pitch_val}mm matches valid metric fine thread pitch for {m_size}.",
                    severity="INFO"
                )
            else:
                return ValidationRuleResult(
                    rule_name="thread_pitch_validity",
                    passed=False,
                    message=f"Pitch {pitch_val}mm deviates from standard coarse ({coarse_pitch}mm) and fine thread specs for {m_size}.",
                    severity="WARNING"
                )

        return ValidationRuleResult(
            rule_name="thread_pitch_validity",
            passed=True,
            message=f"Pitch {pitch_val}mm recorded for thread diameter {diameter_str}.",
            severity="INFO"
        )

    @staticmethod
    def _validate_material_grade(material: str, grade: str) -> ValidationRuleResult:
        mat_lower = material.lower()
        grade_upper = grade.upper()

        if "304" in mat_lower or "ss304" in mat_lower:
            if "A2" in grade_upper or "304" in grade_upper or "18-8" in grade_upper:
                return ValidationRuleResult(
                    rule_name="material_grade_compatibility",
                    passed=True,
                    message=f"Material '{material}' is fully compatible with Grade '{grade}'.",
                    severity="INFO"
                )
            elif "A4" in grade_upper or "8.8" in grade_upper or "10.9" in grade_upper:
                return ValidationRuleResult(
                    rule_name="material_grade_compatibility",
                    passed=False,
                    message=f"Incompatibility: Material '{material}' does not match Grade '{grade}'. Expected A2 series.",
                    severity="ERROR"
                )

        if "316" in mat_lower or "ss316" in mat_lower:
            if "A4" in grade_upper or "316" in grade_upper:
                return ValidationRuleResult(
                    rule_name="material_grade_compatibility",
                    passed=True,
                    message=f"Material '{material}' is compatible with Grade '{grade}'.",
                    severity="INFO"
                )
            elif "A2" in grade_upper:
                return ValidationRuleResult(
                    rule_name="material_grade_compatibility",
                    passed=False,
                    message=f"Incompatibility: Material '{material}' (316) mismatches Grade '{grade}' (A2/304).",
                    severity="ERROR"
                )

        return ValidationRuleResult(
            rule_name="material_grade_compatibility",
            passed=True,
            message=f"Material '{material}' recorded with Grade '{grade}'.",
            severity="INFO"
        )

    @staticmethod
    def _validate_standard_format(standard: str) -> ValidationRuleResult:
        std_upper = standard.upper()
        if any(prefix in std_upper for prefix in ["DIN", "ISO", "ANSI", "ASME", "BS", "JIS"]):
            return ValidationRuleResult(
                rule_name="standard_designation_validity",
                passed=True,
                message=f"Standard designation '{standard}' follows recognized international standard format.",
                severity="INFO"
            )
        return ValidationRuleResult(
            rule_name="standard_designation_validity",
            passed=False,
            message=f"Standard '{standard}' is not recognized as a standard DIN/ISO/ANSI designation.",
            severity="WARNING"
        )

    @staticmethod
    def _validate_length_bounds(length_str: str) -> ValidationRuleResult:
        try:
            num_match = re.search(r"[-+]?\d*\.\d+|\d+", length_str)
            if num_match:
                length_val = float(num_match.group())
                if length_val <= 0 or length_val > 3000:
                    return ValidationRuleResult(
                        rule_name="dimension_bounds_check",
                        passed=False,
                        message=f"Length value {length_val}mm is out of plausible industrial fastener bounds (1mm - 3000mm).",
                        severity="ERROR"
                    )
                return ValidationRuleResult(
                    rule_name="dimension_bounds_check",
                    passed=True,
                    message=f"Length {length_val}mm is within plausible bounds.",
                    severity="INFO"
                )
        except Exception:
            pass

        return ValidationRuleResult(
            rule_name="dimension_bounds_check",
            passed=True,
            message=f"Length '{length_str}' checked.",
            severity="INFO"
        )
