import os
import logging
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
import fitz  # PyMuPDF
import pdfplumber

logger = logging.getLogger("unilogger.ingestion")

class ExtractedTable(BaseModel):
    page_number: int
    headers: List[str] = []
    rows: List[List[str]] = []

class ExtractedBlock(BaseModel):
    page_number: int
    text: str
    bbox: Optional[List[float]] = None

class ExtractedPage(BaseModel):
    page_number: int
    text: str
    blocks: List[ExtractedBlock] = []
    tables: List[ExtractedTable] = []
    has_ocr_fallback: bool = False

class ExtractedDocument(BaseModel):
    filename: str
    total_pages: int
    pages: List[ExtractedPage]
    full_text: str

class PDFIngestionEngine:
    def __init__(self, min_page_text_length: int = 30):
        self.min_page_text_length = min_page_text_length

    def extract_document(self, file_path: str) -> ExtractedDocument:
        """
        Parses a PDF file using PyMuPDF for text blocks and pdfplumber for table extraction.
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        filename = os.path.basename(file_path)
        pages_data: List[ExtractedPage] = []
        full_text_parts: List[str] = []

        # Step 1: Open PyMuPDF doc for fast text and block extraction
        doc = fitz.open(file_path)
        total_pages = len(doc)

        # Step 2: Open pdfplumber for table extraction
        plumber_pdf = None
        try:
            plumber_pdf = pdfplumber.open(file_path)
        except Exception as e:
            logger.warning(f"pdfplumber failed to open {file_path}: {e}")

        for page_idx in range(total_pages):
            page_num = page_idx + 1
            pymupdf_page = doc[page_idx]
            
            # Extract text blocks
            page_text = pymupdf_page.get_text("text").strip()
            blocks_raw = pymupdf_page.get_text("blocks")
            
            blocks: List[ExtractedBlock] = []
            for b in blocks_raw:
                block_text = b[4].strip()
                if block_text:
                    blocks.append(ExtractedBlock(
                        page_number=page_num,
                        text=block_text,
                        bbox=[float(b[0]), float(b[1]), float(b[2]), float(b[3])]
                    ))

            # Extract tables using pdfplumber if available
            tables: List[ExtractedTable] = []
            if plumber_pdf and page_idx < len(plumber_pdf.pages):
                try:
                    plumber_page = plumber_pdf.pages[page_idx]
                    raw_tables = plumber_page.extract_tables()
                    for tbl in raw_tables:
                        if not tbl or len(tbl) == 0:
                            continue
                        # Clean cell values
                        cleaned_rows = []
                        for row in tbl:
                            cleaned_row = [str(cell).strip() if cell is not None else "" for cell in row]
                            if any(cleaned_row):
                                cleaned_rows.append(cleaned_row)
                        if cleaned_rows:
                            headers = cleaned_rows[0]
                            rows = cleaned_rows[1:] if len(cleaned_rows) > 1 else []
                            tables.append(ExtractedTable(
                                page_number=page_num,
                                headers=headers,
                                rows=rows
                            ))
                except Exception as tbl_err:
                    logger.warning(f"Table extraction error on page {page_num}: {tbl_err}")

            # Check OCR fallback trigger if text is suspiciously short
            has_ocr = False
            if len(page_text) < self.min_page_text_length:
                # Attempt pytesseract OCR if available
                ocr_text = self._attempt_ocr_fallback(pymupdf_page)
                if ocr_text:
                    page_text = ocr_text
                    has_ocr = True

            extracted_page = ExtractedPage(
                page_number=page_num,
                text=page_text,
                blocks=blocks,
                tables=tables,
                has_ocr_fallback=has_ocr
            )

            pages_data.append(extracted_page)
            full_text_parts.append(f"--- Page {page_num} ---\n{page_text}")

        doc.close()
        if plumber_pdf:
            plumber_pdf.close()

        return ExtractedDocument(
            filename=filename,
            total_pages=total_pages,
            pages=pages_data,
            full_text="\n\n".join(full_text_parts)
        )

    def _attempt_ocr_fallback(self, page: fitz.Page) -> Optional[str]:
        """
        Fallback OCR method using Tesseract when born-digital text is missing.
        """
        try:
            import pytesseract
            from PIL import Image
            import io

            pix = page.get_pixmap(dpi=150)
            img = Image.open(io.BytesIO(pix.tobytes()))
            ocr_text = pytesseract.image_to_string(img).strip()
            return ocr_text if ocr_text else None
        except Exception as e:
            logger.debug(f"OCR fallback unavailable or failed: {e}")
            return None
