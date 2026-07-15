## Description
Build automated pipeline to ingest DBE past exam PDFs, extract questions via OCR + AI, structure into QuestionEngine format, tag with competency metadata, and make available for "Past Paper Practice" mode.

## Acceptance Criteria
- [ ] `POST /api/exam-papers/ingest` -- upload PDF (multipart), returns `jobId`
- [ ] Background job: `pdf-parse` → OCR (Tesseract.js / cloud) → AI question extraction → validation → DB insert
- [ ] AI extraction prompt: identifies question number, type, marks, text, diagrams, answer key, topic tags
- [ ] Human review queue: `/admin/exam-papers/review` -- side-by-side PDF vs extracted, approve/edit/reject
- [ ] Competency tagging: maps to `CompetencyEngine` topics (per-paper P1/P2 split from S5)
- [ ] `ExamPaperIngestionService` -- `src/lib/exam-paper-ingestion/` (exists, extend)
- [ ] "Past Paper Practice" mode: timed exam using real papers, P1/P2 selector, instant grading
- [ ] Copyright compliance: only DBE-published papers (2018-2024), metadata tracking

## Technical Details
- Extends `src/lib/exam-paper-ingestion/` (S27) + `src/lib/exams/sync-exam-papers.ts`
- OCR: Tesseract.js WASM (client) or cloud API (server) -- configurable
- AI: `QuestionEngine` prompt variant for extraction (not generation)
- Dexie: `examPapers`, `paperQuestions` tables (v30+)
- Queue: `QueueCore` job type `exam-paper-ingest`
- Admin UI: `shadcn` DataTable + PDF viewer (`PDFSlick` from S20)

## Dependencies
- Legal clearance for DBE past paper ingestion (copyright)
- QuestionEngine extraction prompt engineering
- CompetencyEngine topic taxonomy alignment

## Effort
4-5 sprints (2 engineers + 1 ML/AI)

## Risks
- PDF layout variance (multi-column, diagrams, tables) -- OCR accuracy
- Copyright -- confirm DBE open license for educational use
- Question extraction quality -- need >85% accuracy for trust