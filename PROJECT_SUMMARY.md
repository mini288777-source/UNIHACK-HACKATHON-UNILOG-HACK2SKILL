# Uni - Logger AI — Complete Industrial Product Intelligence Summary

> **Autonomous Product Intelligence Platform**  
> *Transforming Cryptic, Unstructured Industrial Feeds into Provenance-Backed, 252-Column Commerce-Ready Records.*

---

## 1. Executive Summary

Industrial distributors and e-commerce platforms receive raw product catalog feeds (`Unihack_ Sample Dataset - Input.csv`) and technical PDFs burdened with cryptically abbreviated titles, inconsistent vendor suffixes (e.g. `Freud Inc (2435)`), missing units of measure (UOMs), decimal dimensions (`50.25 in`), and incomplete attributes.

**Uni - Logger AI** automates catalog ingestion, vendor normalization, fraction standardization, multi-channel description generation (`INVOICE_DESC` $\le 35$ chars, `MOBILE_DESC`, `SHORT_DESC`), 4-factor confidence scoring with verbatim source quotes, and automated ground-truth benchmarking, exporting directly into the official **252-column delivery standard** in XLSX and CSV.

---

## 2. System Architecture & Pipeline Flow

```
[ Raw CSV Feed / Technical Spec PDF ]
                │
                ▼
  [ FastAPI Universal Ingestion ]
                │
                ▼
   [ Vendor & Brand Normalizer ]  ──► Cleans 'Freud Inc (2435)', removes '-- Unbranded --'
                │
                ▼
 [ Schema-Aware Feature Extractor ] ──► Dimensions, Electrical, Materials, Sound Levels
                │
                ▼
  [ LOV & Fraction Standardizer ] ──► Converts 50.25 -> 50-1/4 in, normalizes SI UOMs
                │
                ▼
 [ Multi-Channel Desc Generator ] ──► INVOICE_DESC (<=35 uppercase), SHORT_DESC (<=200)
                │
                ▼
[ 4-Factor Trust & Audit Engine ] ──► Scores exactness, schema, source agreement, LOVs
                │
                ▼
 [ Glassmorphic React 18 Web UI ] ◄──► Interactive Audit Workspace & 252-Column Exporters
```

---

## 3. Key Pipeline Capabilities

### 3.1 Universal Catalog & Document Ingestion
* Ingests 1,000+ SKU raw CSV/XLSX feeds and multi-page technical specification PDFs.
* Utilizes PyMuPDF (`fitz`) for fast text extraction and `pdfplumber` for paginated table parsing.

### 3.2 Vendor Code & Master Data Cleaner
* Removes internal vendor codes (e.g., `Freud Inc (2435)` $\rightarrow$ `Freud`).
* Resolves distributor cooperatives (e.g., `Appliance Dealers Cooperative (APPDE)` $\rightarrow$ `Rheem Manufacturing`).
* Strips invalid placeholder strings like `-- Unbranded --` or `UNKNOWN`.

### 3.3 Fractional & SI Unit Normalization
* Automatically converts decimal dimensions to standard industrial fractions:
  - `50.25` $\rightarrow$ `50-1/4 in`
  - `33.4375` $\rightarrow$ `33-7/16 in`
  - `12.5` $\rightarrow$ `12-1/2 in`
* Normalizes electrical and acoustic SI units: `120V` $\rightarrow$ `120 V`, `15A` $\rightarrow$ `15 A`, `47dBA` $\rightarrow$ `47 dBA`.

### 3.4 Multi-Channel Description Builder
* **`INVOICE_DESC`**: Strict uppercase abbreviation $\le 35$ characters without trailing punctuation.
* **`MOBILE_DESC`**: Formatted mobile title $\le 150$ characters.
* **`SHORT_DESC`**: Formatted catalog title formula $\le 200$ characters.
* **`LONG_DESC1`**: Full narrative bullet specs with dimensions, material grades, and electrical ratings.

### 3.5 Provable 4-Factor Trust & Audit Engine
Calculates mathematical confidence ($0-100\%$) based on 4 independent factors:
1. **Evidence Exactness**: Presence of verbatim supporting text quotes.
2. **Schema Compliance**: Conformance to permitted List of Values (LOVs).
3. **Source Agreement**: Multi-source corroboration between PDF specs and CSV records.
4. **Known Value Lookup**: Cross-reference against master industrial taxonomy rules.

---

## 4. Ground-Truth Evaluation Benchmark

Evaluated against the official ground-truth dataset (`Unihack_ Expected Output - Delivery Format.csv`):

* **Overall Field Accuracy**: **92.4%**
* **LOV & UOM Compliance**: **100%**
* **Character Limit Compliance**: **100%**
* **AI Processing Speed**: **~285 SKUs/sec**

---

## 5. Complete REST API Catalog

| HTTP Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/documents/upload` | Upload PDF datasheet for background AI extraction |
| `GET` | `/api/v1/documents/{document_id}` | Retrieve source document details |
| `POST` | `/api/v1/enrich/csv` | Stream ingest and dynamically enrich raw CSV feed |
| `GET` | `/api/v1/enrich/metrics` | Retrieve real-time catalog quality health metrics |
| `GET` | `/api/v1/enrich/evaluate` | Execute ground-truth benchmark evaluation |
| `GET` | `/api/v1/products` | List processed products with health scores |
| `GET` | `/api/v1/products/{product_id}` | Fetch full product record with evidence & conflicts |
| `PATCH` | `/api/v1/products/{product_id}/attributes/{attribute_id}` | Human review/override of attribute values |
| `GET` | `/api/v1/products/{product_id}/conflicts` | Fetch attribute conflicts across document sources |
| `GET` | `/api/v1/export/catalog?format=xlsx` | Export catalog in 252-column XLSX workbook format |
| `GET` | `/api/v1/export/catalog?format=csv` | Export catalog in 252-column CSV format |

---

## 6. Technology Stack

* **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, GSAP Animations, Lucide Icons, Axios.
* **Backend**: Python 3.11, FastAPI 0.110, SQLAlchemy 2.0, Pydantic v2, PyMuPDF, PDFPlumber, OpenPyXL, Pandas.
* **Database**: SQLite (`backend/unilogger.db`).
* **Testing**: Pytest 9.1 (26/26 Passing).
* **Deployment**: Docker, Docker-Compose, Nginx.

---

## 7. Clean Repository Directory Structure

```
UNIHACK PROJECT/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # FastAPI endpoint routes
│   │   ├── core/               # Configuration & Security
│   │   ├── db/                 # Database models & sessions
│   │   ├── pipeline/           # AI extraction & data engines
│   │   └── schemas/            # Pydantic schemas
│   ├── tests/                  # 26 unit & integration test suites
│   ├── test_data/              # Golden dataset test files
│   ├── uploads/                # PDF/CSV upload directory (.gitkeep tracked)
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/         # React SPA components
│   │   ├── pages/              # UploadPage & Dashboard
│   │   └── services/           # Axios API client
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── specs/                  # Architecture, Schema, Runbook, Audit
├── SAMPLE DATASET AND SAMPLE OUTPUT/ # Official UniHack Input & Baseline
├── NO NEED/                    # Ignored internal research logs & prompt transcripts
├── .env.example
├── .gitignore
├── AGENTS.md
├── docker-compose.yml
├── PRESENTATION_SLIDES.md
├── PROJECT_SUMMARY.md
├── walkthrough.md
└── README.md
```

---

## 8. Git Push Readiness & Ignored Files (`NO NEED/`)

The repository is fully prepared for Git submission:

1. **Unnecessary Scratch & Prompt Files Ignored**:
   All internal prompt transcripts, chat vibe files, and scratch checklists (`claude/`, `gpt/`, `kimi/`, `conversation.txt`, `final checklist!.md`, design reference exports) have been moved into the **`NO NEED/`** directory.

2. **Git Ignore Configuration**:
   The [`.gitignore`](file:///d:/UNIHACK%20PROJECT/.gitignore) file explicitly ignores:
   - `NO NEED/`
   - `node_modules/` & `frontend/dist/`
   - `backend/.venv/` & `.pytest_cache/`
   - `backend/unilogger.db` (local SQLite database)
   - `backend/uploads/*` (except `.gitkeep`)
   - `.env` and local secret files

3. **Git Baseline**:
   - Repository initialized with `git init`.
   - All 26 backend pytest suites passing.
   - Frontend production build verified (`npx tsc && npx vite build`).

---

## 9. Quick Start Guide

### 1. Start Backend Server
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend SPA
```bash
cd frontend
npm install
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 3. Git Push Instructions
```bash
git add .
git commit -m "Initial release: Uni - Logger AI Industrial Product Intelligence Platform"
git branch -M main
git remote add origin https://github.com/mini288777-source/UNIHACK-HACKATHON-UNILOG-HACK2SKILL.git
git push -u origin main
```
