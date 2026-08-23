import pytest
from app.db.models import KnowledgeType
from app.pipeline.normalizer import FastenerNormalizer

def test_material_normalization():
    norm_mat1 = FastenerNormalizer.normalize_material("SS304")
    assert norm_mat1 == "Stainless Steel 304"

    norm_mat2 = FastenerNormalizer.normalize_material("304 stainless")
    assert norm_mat2 == "Stainless Steel 304"

    norm_mat3 = FastenerNormalizer.normalize_material("ss316")
    assert norm_mat3 == "Stainless Steel 316"

    norm_mat4 = FastenerNormalizer.normalize_material("class 8.8")
    assert norm_mat4 == "Carbon Steel Class 8.8"

def test_dimension_and_unit_conversion():
    # Inches conversion to mm
    val, unit, converted = FastenerNormalizer.normalize_dimension("2", "inch")
    assert val == "50.8"
    assert unit == "mm"
    assert converted is True

    # Fractional 0.5 inch -> 12.7 mm
    val2, unit2, converted2 = FastenerNormalizer.normalize_dimension("0.5", "in")
    assert val2 == "12.7"
    assert unit2 == "mm"
    assert converted2 is True

def test_standard_formatting():
    assert FastenerNormalizer.normalize_standard("DIN933") == "DIN 933"
    assert FastenerNormalizer.normalize_standard("ISO4017") == "ISO 4017"
    assert FastenerNormalizer.normalize_standard("DIN 934") == "DIN 934"

def test_attribute_knowledge_classification():
    # Explicit fact
    v1, u1, k1 = FastenerNormalizer.normalize_attribute("Material", "Stainless Steel 304")
    assert k1 == KnowledgeType.EXPLICIT_FACT

    # Normalized fact
    v2, u2, k2 = FastenerNormalizer.normalize_attribute("Material", "SS304")
    assert v2 == "Stainless Steel 304"
    assert k2 == KnowledgeType.NORMALIZED_FACT

    # Derived info (unit conversion)
    v3, u3, k3 = FastenerNormalizer.normalize_attribute("Length", "2", "in")
    assert v3 == "50.8"
    assert u3 == "mm"
    assert k3 == KnowledgeType.DERIVED_INFO

    # Inferred info
    v4, u4, k4 = FastenerNormalizer.normalize_attribute("Pitch", "1.5", "mm", is_inferred=True)
    assert k4 == KnowledgeType.INFERRED_INFO
