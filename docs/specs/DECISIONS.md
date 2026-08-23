# Uni - Logger — Decisions Log

## Decision 001: Frontend Framework Selection
- **Problem**: Select frontend framework for internal workspace UI.
- **Options**: Next.js 14 App Router vs Vite + React + TypeScript SPA.
- **Selected**: Vite + React + TypeScript SPA.
- **Reason**: The application is an internal product data workspace without public SEO requirements. Vite provides instant HMR, fast builds, and avoids Next.js server-side rendering complexity and routing overlap with FastAPI.
- **Tradeoffs**: No built-in SSR (not needed for this application).

## Decision 002: Confidence Score Calculation Methodology
- **Problem**: How to calculate attribute confidence scores reliably.
- **Options**: Ask LLM for self-reported confidence percentage vs Deterministic 4-Factor Mathematical Formula.
- **Selected**: Deterministic 4-Factor Mathematical Formula.
- **Reason**: LLMs produce uncalibrated self-confidence scores and frequently assign 95%+ confidence to hallucinated attributes. A deterministic Python formula ($0.35\text{Evidence} + 0.25\text{Schema} + 0.20\text{Agreement} + 0.20\text{Lookup}$) provides provable, auditable confidence.
- **Tradeoffs**: Requires maintaining lookup tables and exact match scoring logic.

## Decision 003: Single Database Strategy
- **Problem**: Database selection for relational data and vector similarity matching.
- **Options**: PostgreSQL + separate Vector DB (Chroma/Pinecone) vs Single PostgreSQL 15+ with pgvector.
- **Selected**: Single PostgreSQL 15+ with pgvector.
- **Reason**: Keeps infrastructure unified, transactional, and simple during a hackathon while providing full vector capability for duplicate entity resolution.
- **Tradeoffs**: Requires pgvector extension enabled in PostgreSQL.

## Decision 004: Async Ingestion Model
- **Problem**: Document processing execution model.
- **Options**: Synchronous HTTP upload vs FastAPI BackgroundTasks with job polling.
- **Selected**: FastAPI BackgroundTasks with frontend polling.
- **Reason**: Prevents gateway request timeouts on multi-page PDFs without requiring heavy Redis/Celery queue infrastructure.
- **Tradeoffs**: Frontend must poll `/api/v1/jobs/{job_id}` for progress updates.
