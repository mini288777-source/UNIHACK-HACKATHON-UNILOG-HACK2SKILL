# Uni - Logger — Project Context

## Project Overview
**Uni - Logger** is an AI-Powered Product Intelligence Platform for Industrial Commerce. It transforms fragmented, unstructured product data (PDF spec sheets, catalogs, supplier tables) into normalized, validated, provenance-backed, and commerce-ready product records.

## Core Value Proposition
> **"We don't just extract product data with AI. We prove it."**

## Key Capabilities
1. **Multi-Source Ingestion & Parsing**: Text & table parsing using PyMuPDF and pdfplumber with OCR fallback.
2. **Schema-Enforced LLM Extraction**: OpenAI GPT-4o with structured JSON outputs and prompt-injection defense (`<untrusted_document_content>`).
3. **4-Tier Knowledge Classification**: `EXPLICIT_FACT`, `NORMALIZED_FACT`, `DERIVED_INFO`, `INFERRED_INFO`.
4. **Fastener Domain Normalization & Rule Validation**: Standardizes material names and units; enforces domain constraints.
5. **Deterministic 4-Factor Confidence Scoring**: Calculated mathematically from evidence exactness, schema validity, source agreement, and known-value lookup.
6. **5-State Trust Status Model**: `VERIFIED`, `HIGH_CONFIDENCE`, `NEEDS_REVIEW`, `CONFLICT`, `UNKNOWN`.
7. **Interactive Workspace UI**: Product Data Health Score, attribute table with trust badges, evidence drawer, and JSON/CSV export.

## Technology Stack
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS (SPA)
- **Backend**: FastAPI (Python 3.11+) + Pydantic v2
- **Database**: PostgreSQL 15+ with pgvector
- **ORM & Migrations**: SQLAlchemy 2.0 + Alembic
- **Document Parsing**: PyMuPDF (fitz) + pdfplumber + pytesseract
- **LLM**: OpenAI GPT-4o / GPT-4o-mini (JSON Mode)
- **Testing**: pytest + httpx

## Key Directories
- `backend/app/api/v1/endpoints/`: REST API routers
- `backend/app/pipeline/`: Ingestion, extraction, normalization, validation, confidence, conflict, orchestrator modules
- `backend/app/db/`: SQLAlchemy models & session
- `frontend/src/components/`: UI components (Upload, Workspace, Evidence Drawer, Export Modal)
