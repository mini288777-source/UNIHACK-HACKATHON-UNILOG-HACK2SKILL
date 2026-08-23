from typing import List, Optional
from pydantic import BaseModel, Field

class RawExtractedAttribute(BaseModel):
    name: str = Field(
        ...,
        description="Name of the attribute (e.g. Material, Thread Diameter, Length, Standard, Finish, Pitch, Tensile Strength)."
    )
    raw_value: str = Field(
        ...,
        description="Exact value as extracted or inferred from the text (e.g. SS304, M10, 50mm, DIN 933)."
    )
    unit: Optional[str] = Field(
        None,
        description="Unit of measure if applicable (e.g. mm, inches, MPa, kN, kg)."
    )
    quoted_evidence: str = Field(
        ...,
        description="Exact quoted text snippet from the document supporting this attribute."
    )
    page_number: int = Field(
        default=1,
        description="Page number where the attribute was found."
    )
    is_inferred: bool = Field(
        default=False,
        description="True if attribute value was inferred by AI rather than explicitly stated."
    )
    inferred_reason: Optional[str] = Field(
        None,
        description="Reasoning if the value was inferred (e.g., DIN 933 implies M10 pitch 1.5mm)."
    )

class RawExtractedProduct(BaseModel):
    product_name: str = Field(
        ...,
        description="Full descriptive name of the product (e.g. Heavy Hex Head Bolt M10 x 50mm)."
    )
    category: Optional[str] = Field(
        default="Fasteners > Bolts > Hex Bolts",
        description="Product taxonomy category."
    )
    manufacturer: Optional[str] = Field(
        None,
        description="Manufacturer or brand name if identified."
    )
    sku_model: Optional[str] = Field(
        None,
        description="Part number, SKU, or item code."
    )
    attributes: List[RawExtractedAttribute] = Field(
        default_factory=list,
        description="List of extracted attributes with quoted evidence."
    )

class RawExtractionResponse(BaseModel):
    products: List[RawExtractedProduct] = Field(
        default_factory=list,
        description="List of products extracted from document content."
    )
