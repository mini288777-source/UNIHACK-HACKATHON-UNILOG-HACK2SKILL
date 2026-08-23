# AGENTS.md — AI Coding Agent Guidelines & Repository Blueprint

This document serves as the authoritative operational manual for AI agents working within the **Uni - Logger AI** repository.

---

## 1. PROJECT OVERVIEW

**Uni - Logger AI** is an autonomous industrial product intelligence platform designed to ingest raw catalog feeds (`Unihack_ Sample Dataset - Input.csv`) and technical specification PDFs, clean vendor data, standardize units of measure (UOMs) and fractional dimensions (`50-1/4 in`), generate multi-channel descriptions (`INVOICE_DESC` $\le 35$ chars, `MOBILE_DESC`, `SHORT_DESC`), compute mathematical 4-factor confidence scores with verbatim page quotes, and export the official **252-column delivery standard** in XLSX and CSV.

---

## 2. CURRENT ARCHITECTURE & FLOW

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

## 3. TECHNOLOGY STACK

* **Frontend**: React 18, TypeScript 5, Vite 5, Tailwind CSS 3, GSAP Animations, Lucide Icons, Axios.
* **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (SQLite/PostgreSQL), Pydantic v2, PyMuPDF (fitz), PDFPlumber, OpenPyXL, Pandas.
* **Testing & Benchmarking**: Pytest, Pytest-Asyncio, HTTPX, Automated Ground-Truth Evaluation Engine.
* **Deployment**: Docker, Docker-Compose, Nginx.

---

## 4. DIRECTORY MAP

```
d:/UNIHACK PROJECT/
├── backend/                  # FastAPI Application Service
│   ├── app/
│   │   ├── api/v1/endpoints/ # API Routes (documents, products, enrichment, export, jobs)
│   │   ├── core/             # Configuration & Security
│   │   ├── db/               # SQLAlchemy Models & Database Session
│   │   ├── pipeline/         # Core Processing Engines (Normalizer, Extraction, Trust, Evaluation)
│   │   └── schemas/          # Pydantic Request/Response Models
│   ├── tests/                # 26 Unit & Integration Tests
│   ├── test_data/            # Golden Dataset Test Files
│   └── uploads/              # Temporary Upload Directory (.gitkeep tracked)
├── frontend/                 # React 18 Web Application
│   ├── src/
│   │   ├── components/       # UI Components (Header, Sidebar, Workspace, Upload, Modals)
│   │   ├── pages/            # Page Components (UploadPage, Dashboard)
│   │   ├── services/         # Axios API Client (`api.ts`)
│   │   └── types/            # TypeScript Interfaces (`index.ts`)
│   └── dist/                 # Production Build Output (Ignored in Git)
├── docs/                     # Documentation Repository
│   ├── specs/                # Architecture, Schema, Decisions, Runbook, Audit
│   ├── research/             # Exploration & Prompts
│   └── design/               # UI/UX Reference Exports
├── SAMPLE DATASET AND SAMPLE OUTPUT/ # Official UniHack Input & Ground-Truth Baseline
├── PRESENTATION_SLIDES.md    # Complete 15-Slide Presentation Deck Content
├── PROJECT_SUMMARY.md        # Comprehensive Structured Project Manual
├── walkthrough.md            # Comprehensive System Walkthrough & Verification Report
├── README.md                 # Developer Setup & Operating Instructions
├── .gitignore                # Git Ignore Specifications
└── docker-compose.yml        # Multi-Container Deployment Manifest
```

---

## 5. CRITICAL PIPELINE RULES & CONSTRAINTS

1. **Zero-Hallucination Data Integrity**:
   - Never fabricate product attributes, values, or confidence scores.
   - If evidence is missing, mark attributes as `NEEDS_REVIEW` or `UNVERIFIED`.
   - Preserve exact verbatim text quotes in attribute evidence objects.

2. **Strict Description Constraints**:
   - `INVOICE_DESC`: Must be $\le 35$ characters, uppercase, no trailing punctuation.
   - `MOBILE_DESC`: Must be $\le 150$ characters.
   - `SHORT_DESC`: Must be $\le 200$ characters.

3. **252-Column Delivery Format Preservation**:
   - All 252 static header columns in `Unihack_ Expected Output - Delivery Format.csv` must be strictly maintained in CSV and XLSX exports.

---

## 6. COMMANDS & VERIFICATION

### Backend Development
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Backend Testing Suite
```bash
cd backend
python -m pytest
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 7. RULES FOR FUTURE AI AGENTS

* **DO NOT** rewrite working components, models, or pipeline logic without empirical test failure proof.
* **DO NOT** commit secrets, `.env` files, `.venv`, `node_modules`, or local SQLite databases (`unilogger.db`).
* **DO NOT** execute `git push` without explicit user confirmation.
* **ALWAYS** run `pytest` and `npm run build` to verify changes before completing a task.
