# Uni - Logger AI — Honest MVP Limitations

As part of our commitment to **absolute trust and zero false claims**, this document records the current boundary conditions of our MVP prototype.

---

## Current MVP Boundaries

1. **Domain Validation Focus**:
   - The current validation engine contains explicit physics rules for **Industrial Fasteners** (metric coarse/fine pitches M3–M30, ISO 4017/DIN 933 standards, SS304/SS316 material grade compatibility).
   - Non-fastener categories (e.g., electrical switches, pumps) extract attributes safely but rely on schema structure and evidence matching rather than category-specific physics rules.

2. **Source Discovery**:
   - The MVP ingests uploaded technical PDFs and specification datasheets directly. Automated web crawling across external manufacturer domains is designed in our architecture roadmap but not active in local offline execution mode.

3. **OCR Processing**:
   - High-resolution digital PDFs with text layers extract instantly. Scanned image-only PDFs fall back to standard text extraction layers unless an external OCR key (Tesseract/Google Vision) is configured.

4. **Multi-User Role Authentication**:
   - All manual overrides currently log under the default active session user (`SysAdmin_04`). Role-based access control (RBAC) with JWT auth is planned for production enterprise deployment.
