# Uni - Logger AI — Technical Architecture

## Overview

Uni - Logger AI is architected using a decoupled **React/Vite Frontend** and a **FastAPI Async Pipeline Backend**. The system enforces absolute groundedness: no extracted attribute is persisted without verbatim page quote citations.

---

## Component Layers

### 1. Ingestion Layer (`app.pipeline.ingestion`)
- Extracts raw text, table structures, and page indexes from uploaded PDFs using PyPDF / PDFPlumber.
- Enforces chunked streaming file uploads (1MB chunks, max 20MB limit) to protect server memory.

### 2. Extraction & Normalization (`app.pipeline.llm_extractor` & `app.pipeline.normalizer`)
- Prompts OpenAI GPT-4o with strict JSON schema instructions.
- If API keys are unconfigured or fail, falls back to grounded text regex parsing rather than hallucinated fake attributes.
- Normalizes unit expressions (e.g. `10mm`, `10 mm` -> `10`, `mm`).

### 3. Fastener Physics Validation Engine (`app.pipeline.validator`)
- `FastenerValidator._validate_thread_pitch`: Compares diameter and pitch against standard ISO/DIN metric coarse (M3-M30) and fine thread lookup tables.
- `FastenerValidator._validate_material_grade`: Verifies compatibility between materials (e.g. SS304 vs SS316) and property classes (A2 vs A4).
- `FastenerValidator._validate_standard_format`: Checks designation formats (DIN 933, ISO 4017, ANSI B18.2.1).

### 4. Trust & Confidence Engine (`app.pipeline.confidence`)
- Computes deterministic confidence scores based on 4 factors:
  1. Evidence Exactness (Text quote match)
  2. Schema Validity
  3. Source Agreement
  4. Domain Rule Compliance
- Computes Overall Product Data Health Score (0 - 100%).

### 5. Persistence & Audit Layer (`app.db.models`)
- `SourceDocument`: PDF metadata and upload records.
- `ProcessingJob`: Asynchronous status ledger (PENDING -> PARSING -> EXTRACTING -> NORMALIZING -> VALIDATING -> COMPLETED).
- `Product` & `ProductAttribute`: Structured product specifications.
- `Evidence`: Text quotes, page numbers, and confidence breakdowns.
- `Conflict`: Cross-document contradiction records.
- `AuditLog`: Immutable log tracking user manual overrides.

---

## Data Flow Diagram

```
Upload Endpoint (20MB Stream) ──► PyPDF Ingestion Engine ──► Grounded LLM Extractor
                                                                       │
                                                                       ▼
Product Health Score (0-100%) ◄── Trust & Confidence Engine ◄── Fastener Validator
            │
            ▼
    Stitch React SPA ◄── REST APIs (JSON/CSV Export) ◄── AuditLog Persistence
```
