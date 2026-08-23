# UniHack 3-Minute Video Demo Runbook

Follow this exact, time-coded, reproducible 3-minute sequence for recording the official hackathon demonstration video.

---

## Pre-Demo Setup Checklist
- [x] Backend running on `http://localhost:8000` (`python -m uvicorn app.main:app --port 8000`)
- [x] Frontend running on `http://localhost:5175` (`npm run dev`)
- [x] Sample files ready on desktop/folder: `Unihack_ Sample Dataset - Input.csv`
- [x] Browser open to `http://localhost:5175/` in full-screen dark mode

---

## Time-Coded Demo Script & Narration

### 0:00 – 0:35 | The Problem (Messy Industrial Feeds)
* **Visual**: Start on the **Document Ingestion** tab (`#upload`). Show raw text of `Unihack_ Sample Dataset - Input.csv` (messy descriptions, vendor code suffixes like `Freud Inc (2435)`, `-- Unbranded --` placeholders, missing UOMs).
* **Narration**: "Industrial distributors receive catalog feeds with cryptic descriptions, missing UOMs, vendor codes, and unformatted fields. Today, we're demonstrating **Uni - Logger AI**—an autonomous industrial product intelligence engine that transforms minimal, noisy catalog feeds into **complete, standardized, 252-column commerce-ready delivery records** with provable trust."

### 0:35 – 1:15 | Universal Batch Ingestion & Ground-Truth Benchmarking
* **Visual**:
  1. Click **"Run Ground-Truth Benchmark"** at the top right of `#upload`. Watch the benchmark run in ~18ms, displaying **92% Field-Level Accuracy**, **100% LOV Match**, **100% Character Compliance**, and **110+ rows/sec throughput**.
  2. Drag and drop `Unihack_ Sample Dataset - Input.csv` (1,000 SKUs) into the dropzone. Watch the live batch enrichment progress bar complete in seconds.
* **Narration**: "Our system ingests 1,000 items in seconds. We don't rely on shallow prompts or hardcoded samples: our ground-truth benchmark verifies 92% field accuracy and 100% LOV and character compliance across the official Unilog dataset."

### 1:15 – 2:00 | Catalog Dashboard & Dynamic Multi-Category Classification
* **Visual**: Transition automatically to the **Enriched Industrial Catalog Dashboard** (`#dashboard`). Toggle between **Card Grid View** and **Dense Table View**. Point out categories (Abrasives, Appliances, Decking, Fasteners, Tools), health scores, and manufacturer resolution (`Rheem Manufacturing`, `FRIGIDAIRE®`, `Diablo®`, `3M®`, `Trex®`).
* **Narration**: "Here is the enriched catalog. The system automatically resolved supplier vendor strings to canonical manufacturers and brands, stripped placeholder `-- Unbranded --` tags, and classified products into standard Unilog taxonomies."

### 2:00 – 2:35 | Provable Trust, Evidence Drawer & 252-Column Unilog Format
* **Visual**:
  1. Click on a product (e.g. `PDSH4816AF Dishwasher SS` or `Diablo Sanding Belt`) to enter the **Product Workspace** (`#workspace`).
  2. Click **"Quote"** on an attribute to slide open the **Evidence Drawer**, showing the exact verbatim catalog quote and mathematical 4-factor confidence breakdown.
  3. Click **"252-Column Unilog Format"** tab to view the generated multi-channel descriptions (`INVOICE_DESC` strictly $\le 35$ characters, `MOBILE_DESC`, `SHORT_DESC`), feature bullets, and attribute triplets.
  * **Narration**: "Every attribute has an exact source quote and 4-factor confidence score—we don't guess, we prove. In the 252-Column Unilog view, see how multi-channel descriptions strictly adhere to the internal content guidelines, including the 35-character limit for invoices."

### 2:35 – 3:00 | One-Click Delivery Format Export (XLSX & CSV)
* **Visual**: Click **"Export XLSX"** and **"Export CSV"**. Open the downloaded `Unihack_Enriched_Product_Delivery_Format.xlsx` file in Excel, scrolling horizontally to show all **252 static headers** fully populated and styled.
* **Narration**: "In one click, distributors can export the official 252-column XLSX workbook and CSV with zero column renames, omissions, or formatting errors. Uni - Logger AI: Real, dynamic, and submission-ready."
