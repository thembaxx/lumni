<!-- LAST_SYNC: 2026-05-31 -->
# Master Context — Lumni

## Project Identity
AI-powered South African Matric (Grade 12) prep platform. Offline-first architecture, Emerald Study Room design system.

## Current Sprint
- **Focus**: Finalizing B2B2C flows (Teacher assignments, Parent reports), AI observability, and premium gating.
- **Active Tasks**:
  - Verifying Appwrite SA Region migration console-side.
  - Hardening photo-math OCR event bus integration.
  - Finalizing localization for AF and ZU.
- **Blockers**: WhatsApp Business API verification (external).

## Next Actions
1. **Maintenance**: Refresh context layer to follow the new 4-file production standard.
2. **Cleanup**: Delete redundant `prompt-catalog.md` and `code-signatures.json`.
3. **Verify**: Ensure `CLAUDE.md` is correctly directing agents to the context layer.

## Key Constraints
- **AI Budget**: 2000 global calls/day. Strict per-user caps (20 gen, 100 grade, 20 hint, 50 visual).
- **Offline-First**: Dexie is the source of truth for all client reads.
- **Math**: Dollar-sign delimiters only.

## Decision Log
- [D030] **Mega-component breakdown**: extracted 45+ sub-components from 10 overgrown files into co-located subdirs.
- [D031] **Student Assignments**: Teachers can assign topics via Appwrite; students see "My Assignments" on dashboard.
- [D032] **Snap-to-Answer**: Photo-math OCR results are injected into quiz inputs via a custom event bus.
