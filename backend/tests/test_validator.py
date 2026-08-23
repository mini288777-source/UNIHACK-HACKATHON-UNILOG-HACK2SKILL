import pytest
from app.pipeline.validator import FastenerValidator

def test_thread_pitch_validation():
    # Valid M10 1.5mm coarse thread
    attrs1 = {"Thread Diameter": "M10", "Thread Pitch": "1.5"}
    results1 = FastenerValidator.validate_attributes(attrs1)
    pitch_rule1 = [r for r in results1 if r.rule_name == "thread_pitch_validity"][0]
    assert pitch_rule1.passed is True
    assert "matches standard coarse thread pitch" in pitch_rule1.message

    # Deviating thread pitch (M10 with 3.0mm pitch)
    attrs2 = {"Thread Diameter": "M10", "Thread Pitch": "3.0"}
    results2 = FastenerValidator.validate_attributes(attrs2)
    pitch_rule2 = [r for r in results2 if r.rule_name == "thread_pitch_validity"][0]
    assert pitch_rule2.passed is False
    assert "deviates from standard coarse" in pitch_rule2.message

def test_material_grade_compatibility():
    # Compatible SS304 + A2-70
    attrs1 = {"Material": "Stainless Steel 304", "Grade": "A2-70"}
    results1 = FastenerValidator.validate_attributes(attrs1)
    mat_rule1 = [r for r in results1 if r.rule_name == "material_grade_compatibility"][0]
    assert mat_rule1.passed is True

    # Incompatible SS304 + Grade 8.8
    attrs2 = {"Material": "Stainless Steel 304", "Grade": "8.8"}
    results2 = FastenerValidator.validate_attributes(attrs2)
    mat_rule2 = [r for r in results2 if r.rule_name == "material_grade_compatibility"][0]
    assert mat_rule2.passed is False
    assert "Incompatibility" in mat_rule2.message

def test_standard_format_validation():
    attrs = {"Standard": "DIN 933"}
    results = FastenerValidator.validate_attributes(attrs)
    std_rule = [r for r in results if r.rule_name == "standard_designation_validity"][0]
    assert std_rule.passed is True

def test_length_bounds_validation():
    # Valid length
    attrs1 = {"Length": "50"}
    results1 = FastenerValidator.validate_attributes(attrs1)
    len_rule1 = [r for r in results1 if r.rule_name == "dimension_bounds_check"][0]
    assert len_rule1.passed is True

    # Out of bounds length (5000mm)
    attrs2 = {"Length": "5000"}
    results2 = FastenerValidator.validate_attributes(attrs2)
    len_rule2 = [r for r in results2 if r.rule_name == "dimension_bounds_check"][0]
    assert len_rule2.passed is False
