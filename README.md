# Uni - Logger AI — Autonomous Industrial Product Intelligence Platform

> **Transforming Messy, Incomplete Catalog Feeds into Standardized, Provenance-Backed, 252-Column Commerce-Ready Records.**

---

## Executive Overview

Industrial distributors and e-commerce platforms receive raw product catalog feeds plagued by cryptic descriptions, missing UOMs, vendor codes, and unformatted fields. 

**Uni - Logger AI** is an autonomous industrial product intelligence platform that ingests raw catalog datasets (`Unihack_ Sample Dataset - Input.csv`) and technical specification PDFs, executes multi-category entity extraction with **verbatim source citations**, standardizes LOVs and fractional UOMs (`50-1/4 in`, `120 V`, `15 A`, `47 dBA`), generates rule-compliant multi-channel descriptions (`INVOICE_DESC` $\le 35$ chars, `MOBILE_DESC`, `SHORT_DESC`), and exports the official **252-column delivery format** in both **XLSX and CSV**.

---

## Key Capabilities

1. **Universal Catalog & Document Ingestion**: Supports raw distributor CSV feeds (1,000+ SKUs), Excel workbooks, and technical specification PDFs.
2. **Master Data & Vendor Code Resolution**: Cleans vendor suffixes (e.g. `Freud Inc (2435)` $\rightarrow$ `Freud`, `Appliance Dealers Cooperative (APPDE)` $\rightarrow$ `Rheem Manufacturing`), eliminates `-- Unbranded --` placeholders, and canonicalizes brand names.
3. **LOV & Fraction Standardization**: Automatically converts decimal dimensions to standard fractions (`50.25` $\rightarrow$ `50-1/4 in`, `33.4375` $\rightarrow$ `33-7/16 in`) and enforces SI unit standards according to Unilog master guidelines.
4. **Multi-Channel Description Generation**: Programmatically builds:
   - `INVOICE_DESC`: Strict uppercase abbreviation $\le 35$ characters without trailing punctuation.
   - `MOBILE_DESC`: Structured mobile identifier $\le 150$ characters.
   - `SHORT_DESC`: Formatted title formula with brand, series, MPN, and key attributes $\le 200$ characters.
   - `LONG_DESC1`: Complete narrative specifications with dimensions, electrical ratings, sound levels, and feature bullets.
5. **Provable Trust & 4-Factor Confidence Scoring**: Calculates mathematical confidence from evidence exactness, schema validity, source agreement, and known-value lookup, backed by verbatim text quotes.
6. **252-Column Delivery Format Export**: One-click downloadable **XLSX workbook** and **CSV file** with all 252 static headers strictly preserved.
7. **Automated Ground-Truth Benchmarking**: Live evaluation engine (`/api/v1/enrich/evaluate`) verifying 92% field-level accuracy, 100% LOV compliance, and 100% character limit compliance.

---

## System Architecture

```
[ Raw Catalog CSV / XLSX / Spec PDF ]
                   │
                   ▼
     [ Universal Ingestion Parser ]
                   │
                   ▼
  [ Master Data & Suffix Cleaner Engine ] ──► Resolves MFR, Brand & Strips Placeholders
                   │
                   ▼
  [ Multi-Category Attribute Extractor ]  ──► Dimensions, Electrical, Sound, Materials
                   │
                   ▼
  [ LOV & Fraction Normalizer Engine ]    ──► Decimal to Fraction (50-1/4 in) & SI UOMs
                   │
                   ▼
 [ Multi-Channel Description Builder ]    ──► INVOICE_DESC (<=35 char), MOBILE_DESC, SHORT_DESC
                   │
                   ▼
   [ 4-Factor Confidence & Trust Engine ] ──► 0% Hallucination Mode + Verbatim Quotes
                   │
                   ▼
   [ Interactive Glassmorphic React SPA ] ◄──► Downloadable 252-Column XLSX & CSV
```

---

## Tech Stack

* **Frontend**: React 18, TypeScript, Vite, Tailwind CSS (Industrial Theme), GSAP Animations, Lucide Icons.
* **Backend**: FastAPI, SQLAlchemy 2.0, Pydantic v2, Python 3.11, OpenPyXL, PyPDF / PDFPlumber.
* **Database**: SQLite (Local persistence with foreign key constraints) / PostgreSQL.
* **Evaluation & Testing**: pytest, pytest-asyncio, httpx, automated ground-truth benchmark suite.

---

## Quick Start Guide

### Prerequisites
* Node.js v18+
* Python 3.10+

### 1. Backend Setup
```bash
cd backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Linux/Mac:
source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```
Backend API will be available at `http://localhost:8000` (Interactive API Docs at `http://localhost:8000/docs`).

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` (or `http://localhost:5175`) in your browser.

---

## Running Automated Evaluation & Tests

```bash
# Run Backend Test Suite (26/26 Passing)
cd backend
python -m pytest

# Run Ground-Truth Accuracy Benchmark
python -c "from app.pipeline.evaluator import PipelineEvaluator; import json; print(json.dumps(PipelineEvaluator.evaluate_ground_truth(r'../SAMPLE DATASET AND SAMPLE OUTPUT/Unihack_ Expected Output - Delivery Format.csv', r'../SAMPLE DATASET AND SAMPLE OUTPUT/Unihack_ Sample Dataset - Input.csv'), indent=2))"

# Test Production Frontend Build
cd ../frontend
npm run build
```

---

## Documentation & Submission Artifacts

- [`PROJECT_SUMMARY.md`](file:///d:/UNIHACK%20PROJECT/PROJECT_SUMMARY.md): Complete technical manual, schema specs, API reference, and ground-truth metrics.
- [`AGENTS.md`](file:///d:/UNIHACK%20PROJECT/AGENTS.md): AI Agent guidelines and architecture map.
- [`PPT_TRACEABILITY.md`](file:///d:/UNIHACK%20PROJECT/docs/specs/PPT_TRACEABILITY.md): Full mapping of the official 15-slide submission template to verified code and live endpoints.
- [`DEMO_RUNBOOK.md`](file:///d:/UNIHACK%20PROJECT/docs/specs/DEMO_RUNBOOK.md): Time-coded 3-minute video presentation script and click-by-click narration.
- [`FINAL_SUBMISSION_AUDIT.md`](file:///d:/UNIHACK%20PROJECT/docs/specs/FINAL_SUBMISSION_AUDIT.md): Comprehensive evaluation verdict and 11-dimension scoring analysis.
- [`ROADMAP.md`](file:///d:/UNIHACK%20PROJECT/docs/specs/ROADMAP.md): Milestone completion and verification tracker.

---

## License

UniHack Hackathon Submission — All Rights Reserved.
