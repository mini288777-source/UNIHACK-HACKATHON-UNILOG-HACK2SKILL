import * as XLSX from 'xlsx';
import { Product } from '../types';

// Official 252 Static Headers required by UniHack Delivery Format
export const UNILOG_252_HEADERS: string[] = [
  "MFR URL", "Ref URL 1", "Ref URL 2", "Ref URL 3", "Ref URL 4", "Ref URL 5",
  "PART_NUMBER", "Dept", "Class", "Fine", "SKU - MY_PART_NUMBER", "Mfg_Part_Num",
  "Part_Desc", "E1_Brand", "Unilog_Brand", "DIB_Brand", "Part_Manuf",
  "MANUFACTURER_NAME", "BRAND_NAME", "TRADE_NAME", "MANUFACTURER_PART_NUMBER",
  "ALTERNATE_PART_NUMBER", "Classpath",
  "MOBILE_DESC", "INVOICE_DESC", "SHORT_DESC", "LONG_DESC1", "RETAIL_DESC", "MARKETING_DESCRIPTION"
];

// Add ITEM_FEATURES_1 to ITEM_FEATURES_20
for (let i = 1; i <= 20; i++) {
  UNILOG_252_HEADERS.push(`ITEM_FEATURES_${i}`);
}

UNILOG_252_HEADERS.push(
  "With", "Standard/Approvals", "Prop 65", "Application", "Includes", "Product Name"
);

// Add 50 Attribute Triplets (150 columns)
for (let i = 1; i <= 50; i++) {
  UNILOG_252_HEADERS.push(`ATTRIBUTE_LABEL ${i}`);
  UNILOG_252_HEADERS.push(`ATTRIBUTE_VALUE ${i}`);
  UNILOG_252_HEADERS.push(`ATTRIBUTE_UOM ${i}`);
}

UNILOG_252_HEADERS.push(
  "UPC", "EAN", "GTIN", "UNSPSC", "Warranty", "List Price", "Selling Qty", "Selling UOM",
  "Standard Packaging Information", "LENGTH", "LENGTH_UOM", "HEIGHT", "HEIGHT_UOM",
  "WIDTH", "WIDTH_UOM", "WEIGHT", "WEIGHT_UOM", "VOLUME", "VOLUME_UOM",
  "Product Image", "Alternate Image 1", "Alternate Image 2", "Alternate Image 3", "Alternate Image 4",
  "SDS", "SDS_1", "Warranty Information", "Catalog", "Specification Sheet",
  "Instruction/Installation Manual", "Service Manual", "Owners/User Manual", "Line Drawing",
  "MTR", "RoHS", "Full Engineering Drawing", "Energy Star Guide", "Technical Bulletin",
  "Submittal", "Compatibility Chart", "Size Chart", "Product Label/Insert", "Video Link",
  "Video Link 1", "Country Of Origin", "Discontinued", "Actual Image (Yes/No)"
);

export function format252Row(product: Product): Record<string, string> {
  const row: Record<string, string> = {};
  for (const h of UNILOG_252_HEADERS) {
    row[h] = '';
  }

  const sku = product.sku || product.id || '';
  const name = product.name || '';
  const mfr = product.manufacturer || '';
  const category = product.category || 'Industrial Supplies';

  // Base Identification
  row["PART_NUMBER"] = sku.replace(/\D/g, '').substring(0, 8) || '20887830';
  row["SKU - MY_PART_NUMBER"] = sku;
  row["Mfg_Part_Num"] = sku;
  row["MANUFACTURER_PART_NUMBER"] = sku;
  row["Part_Desc"] = name;
  row["E1_Brand"] = mfr || '-- Unbranded --';
  row["Unilog_Brand"] = mfr || '-- No Unilog Brand --';
  row["DIB_Brand"] = mfr || '-- No DIB Brand --';
  row["Part_Manuf"] = mfr;
  row["MANUFACTURER_NAME"] = mfr;
  row["BRAND_NAME"] = mfr;
  row["TRADE_NAME"] = mfr;
  row["Classpath"] = category;
  row["Product Name"] = name;

  // Multi-Channel Descriptions
  // 1. INVOICE_DESC: strictly <= 35 characters, uppercase
  let inv = `${mfr} ${sku} ${name}`.toUpperCase().replace(/[^A-Z0-9\s\/-]/g, ' ').replace(/\s+/g, ' ').trim();
  row["INVOICE_DESC"] = inv.substring(0, 35).trim();

  // 2. MOBILE_DESC: strictly <= 150 characters
  let mob = `${mfr} ${sku}, ${name}`.replace(/\s+/g, ' ').trim();
  row["MOBILE_DESC"] = mob.substring(0, 150).trim();

  // 3. SHORT_DESC: strictly <= 200 characters
  let sh = `${mfr} ${name}`.replace(/\s+/g, ' ').trim();
  row["SHORT_DESC"] = sh.substring(0, 200).trim();

  // 4. LONG_DESC1 & Marketing Description
  row["LONG_DESC1"] = `${mfr} ${name} — High-performance industrial product engineered for professional manufacturing, construction, and maintenance applications.`;
  row["RETAIL_DESC"] = `${name}, ${mfr}`;
  row["MARKETING_DESCRIPTION"] = `Industrial grade ${category} component engineered for precision and durability. Certified to enterprise catalog specifications.`;

  // Populate Features & Attributes
  const attrs = product.attributes || [];
  attrs.forEach((attr, idx) => {
    // Feature bullets
    if (idx < 20) {
      row[`ITEM_FEATURES_${idx + 1}`] = `${attr.name}: ${attr.normalized_value || attr.raw_value || ''}`;
    }
    // 50 Attribute Triplets
    if (idx < 50) {
      row[`ATTRIBUTE_LABEL ${idx + 1}`] = attr.name || '';
      row[`ATTRIBUTE_VALUE ${idx + 1}`] = attr.normalized_value || attr.raw_value || '';
      row[`ATTRIBUTE_UOM ${idx + 1}`] = attr.unit || '';
    }
  });

  return row;
}

export function exportCatalogToXLSX(products: Product[], filename = 'Unihack_252_Delivery_Catalog.xlsx') {
  if (!products || products.length === 0) {
    alert('No products to export. Please upload or load a catalog dataset first.');
    return;
  }

  const rows = products.map(p => format252Row(p));
  const data = [
    UNILOG_252_HEADERS,
    ...rows.map(r => UNILOG_252_HEADERS.map(h => r[h] || ''))
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Column width configuration
  ws['!cols'] = UNILOG_252_HEADERS.map(h => ({
    wch: Math.max(14, Math.min(36, h.length + 3))
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Delivery Format');

  // Generate binary XLSX array
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportCatalogToCSV(products: Product[], filename = 'Unihack_252_Delivery_Catalog.csv') {
  if (!products || products.length === 0) {
    alert('No products to export. Please upload or load a catalog dataset first.');
    return;
  }

  const rows = products.map(p => format252Row(p));
  const escapeCell = (val: string) => `"${(val || '').replace(/"/g, '""')}"`;

  const csvLines = [
    UNILOG_252_HEADERS.map(escapeCell).join(','),
    ...rows.map(r => UNILOG_252_HEADERS.map(h => escapeCell(r[h] || '')).join(','))
  ];

  // UTF-8 BOM (\uFEFF) ensures Microsoft Excel reads UTF-8 characters without corruption
  const blob = new Blob(['\uFEFF' + csvLines.join('\r\n')], {
    type: 'text/csv;charset=utf-8;'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
