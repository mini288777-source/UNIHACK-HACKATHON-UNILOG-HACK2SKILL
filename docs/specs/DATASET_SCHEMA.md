# UNIHACK Official Dataset & Output Schema Specification

## 1. Input Schema (`Unihack_ Sample Dataset - Input.csv`)

| Input Column | Data Type | Sample Value | Description |
|---|---|---|---|
| `Mfg_Part_Num` | String | `DCB518ASTS06G` | Manufacturer Part Number (MPN) |
| `Part_Desc` | String | `DCB518ASTS06G Diablo 1/2"x18" - Sanding Belt 6pc` | Raw, messy supplier part description with embedded dimensions & packaging |
| `E1_Brand` | String | `-- Unbranded --` | Raw legacy brand field (often placeholder) |
| `Unilog_Brand` | String | `-- No Unilog Brand --` | Raw Unilog brand field (often placeholder) |
| `DIB_Brand` | String | `-- No DIB Brand --` | Raw DIB brand field (often placeholder) |
| `Part_Manuf` | String | `Freud Inc (2435)` | Raw manufacturer with supplier ID suffix |

---

## 2. Output Schema (`Unihack_ Expected Output - Delivery Format.csv`)

The delivery format comprises **252 static columns** organized into 11 distinct functional blocks:

### Block 1: Provenance & Sourcing URLs (6 Columns)
* `MFR URL`, `Ref URL 1`, `Ref URL 2`, `Ref URL 3`, `Ref URL 4`, `Ref URL 5`

### Block 2: Taxonomy & Classification (10 Columns)
* `PART_NUMBER`, `Dept`, `Class`, `Fine`, `SKU - MY_PART_NUMBER`, `Mfg_Part_Num`, `Part_Desc`, `E1_Brand`, `Unilog_Brand`, `DIB_Brand`, `Part_Manuf`

### Block 3: Canonical Entity Identification (6 Columns)
* `MANUFACTURER_NAME`: Canonical normalized manufacturer (e.g., `Freud Inc`, `Rheem Manufacturing`, `Whirlpool Corporation`).
* `BRAND_NAME`: Canonical brand (e.g., `Diablo®`, `FRIGIDAIRE®`, `Whirlpool®`).
* `TRADE_NAME`: Registered trade name / trademark if applicable.
* `MANUFACTURER_PART_NUMBER`: Clean MPN.
* `ALTERNATE_PART_NUMBER`: Secondary or distributor SKU.
* `Classpath`: Standard e-commerce category path (e.g., `Appliances & Consumer Electronics>Kitchen Appliances>Built-In Dishwashers`).

### Block 4: Multi-Channel Descriptions (6 Columns)
* `MOBILE_DESC`: Concise, mobile-optimized title (`<Brand> <Series> <Product Name> <Key Features>`).
* `INVOICE_DESC`: Abbreviated, space-constrained ERP invoice string (e.g., `DISHWASHER LEG 5 SST 120V 15A 50-1/4IN`).
* `SHORT_DESC`: Standard catalog short description (`<Brand> <Series> <MPN> <Product Name> With <Features>`).
* `LONG_DESC1`: Complete specification narrative and dimension summary.
* `RETAIL_DESC`: Consumer-facing retail description.
* `MARKETING_DESCRIPTION`: Rich marketing copy and bulleted highlights.

### Block 5: Bulleted Item Features (20 Columns)
* `ITEM_FEATURES_1` through `ITEM_FEATURES_20`: Discrete bulleted selling points and technical capabilities.

### Block 6: Extended Categorization & Compliance (6 Columns)
* `With`: Additional feature modifier (e.g., `With CleanBoost™`).
* `Standard/Approvals`: Certifications list (e.g., `ASSE 1006|CEE Tier 2 Qualified|cUL Listed|ENERGY STAR Certified|NSF Certified|UL Listed`).
* `Prop 65`: California Proposition 65 chemical warning flags.
* `Application`: Intended industrial use case.
* `Includes`: In-box accessory contents.
* `Product Name`: Base noun descriptor (e.g., `Dishwasher`, `Sanding Belt`, `Hex Bolt`).

### Block 7: Dynamic Attribute Grid (150 Columns)
* 50 Triplet Slots:
  - `ATTRIBUTE_LABEL 1`, `ATTRIBUTE_VALUE 1`, `ATTRIBUTE_UOM 1`
  - ...
  - `ATTRIBUTE_LABEL 50`, `ATTRIBUTE_VALUE 50`, `ATTRIBUTE_UOM 50`

### Block 8: Commercial & Ordering Codes (9 Columns)
* `UPC`, `EAN`, `GTIN`, `UNSPSC`, `Warranty`, `List Price`, `Selling Qty`, `Selling UOM`, `Standard Packaging Information`

### Block 9: Physical Dimensions & Logistics (10 Columns)
* `LENGTH`, `LENGTH_UOM`, `HEIGHT`, `HEIGHT_UOM`, `WIDTH`, `WIDTH_UOM`, `WEIGHT`, `WEIGHT_UOM`, `VOLUME`, `VOLUME_UOM`

### Block 10: Digital Asset Links (5 Columns)
* `Product Image`, `Alternate Image 1`, `Alternate Image 2`, `Alternate Image 3`, `Alternate Image 4`

### Block 11: Document Attachments & Compliance (24 Columns)
* `SDS`, `SDS_1`, `Warranty Information`, `Catalog`, `Specification Sheet`, `Instruction/Installation Manual`, `Service Manual`, `Owners/User Manual`, `Line Drawing`, `MTR`, `RoHS`, `Full Engineering Drawing`, `Energy Star Guide`, `Technical Bulletin`, `Submittal`, `Compatibility Chart`, `Size Chart`, `Product Label/Insert`, `Video Link`, `Video Link 1`, `Country Of Origin`, `Discontinued`, `Actual Image (Yes/No)`

---

## 3. Transformation & Normalization Rules

1. **Placeholder Suppression**: Strings matching `-- Unbranded --`, `-- No Unilog Brand --`, `-- No DIB Brand --` are treated as null/empty.
2. **Supplier ID Stripping**: `Freud Inc (2435)` -> `Freud Inc`.
3. **UOM Normalization**: Fractional inches `1/2"x18"` normalized to numeric dimensions with standard UOM `in`.
4. **Header Immobility**: All 252 headers must be preserved with exact spelling, casing, and column order.
