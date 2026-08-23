import os
import fitz

def generate_sample_pdf():
    target_dir = os.path.join(os.path.dirname(__file__), "..", "test_data", "golden_dataset")
    os.makedirs(target_dir, exist_ok=True)
    pdf_path = os.path.join(target_dir, "fastener_sample_catalog.pdf")

    doc = fitz.open()

    # Page 1: Hex Bolts Technical Spec Sheet
    page1 = doc.new_page()
    text_page1 = """ACME INDUSTRIAL FASTENERS CO.
Technical Datasheet — High-Strength Hex Bolts

PRODUCT SPECIFICATION:
Product Name: Heavy Hex Head Bolt M10 x 50mm
Category: Fasteners > Bolts > Hex Bolts
Manufacturer: Acme Industrial Fasteners
SKU / Item Code: ACM-HB-M10-50-SS304

MATERIAL & GRADE:
Material Specification: Grade SS304 Stainless Steel
Standard Designation: DIN 933 / ISO 4017
Tensile Strength: 700 MPa (A2-70)

DIMENSIONS:
Nominal Thread Diameter (d): 10 mm (M10)
Thread Pitch (p): 1.5 mm
Overall Length (L): 50 mm
Head Size Across Flats (s): 17 mm
Head Height (k): 6.4 mm
Finish: Passivated Plain Finish

PAGE 1 END"""
    page1.insert_text((50, 50), text_page1, fontsize=11)

    # Page 2: Dimensional Table Page
    page2 = doc.new_page()
    text_page2 = """ACME INDUSTRIAL FASTENERS CO.
Fastener Compatibility & Specification Matrix — Page 2

PRODUCT METRICS:
Product Name: M10 Hex Nut Stainless Steel 304
Material: SS304
Compatible Bolt Size: M10 x 50mm
Standard: DIN 934

SPECIFICATION SUMMARY:
Attribute Name        | Value               | Unit
--------------------------------------------------
Material Grade        | Stainless Steel 304 | -
Thread Pitch          | 1.5                 | mm
Proof Load            | 50 kN               | kN
Hardness Rating       | HRB 95              | HRB

PAGE 2 END"""
    page2.insert_text((50, 50), text_page2, fontsize=11)

    doc.save(pdf_path)
    doc.close()
    print(f"Generated sample PDF at: {pdf_path}")

if __name__ == "__main__":
    generate_sample_pdf()
