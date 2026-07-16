## Description

Server-side pipeline to ingest DBE past exam PDFs (2018-2024), extract structured questions via OCR + AI, human review queue, and insert into Question DB with competency tags, paper metadata (P1/P2), and year.

## Acceptance Criteria

- [ ] `POST /api/exam-papers/ingest` -- upload PDF (multipart) -> queues ingestion job (QueueCore)
- [ ] OCR extraction: `OCRService` (existing) -> page images -> Tesseract/Cloud Vision -> raw text blocks
- [ ] AI structuring: `QuestionEngine` + custom prompt -> parse questions, options, answers, marks, topic hints
- [ ] Human review queue: Admin UI (`/admin/exam-papers/queue`) -- side-by-side PDF + extracted JSON, approve/edit/reject
- [ ] Metadata extraction: year, session (May/Nov), subject, paper number, language from filename + PDF content
- [ ] Competency tagging: map question topics -> `CompetencyEngine` topic IDs (CAPS curriculum mapping)
- [ ] Duplicate detection: embedding similarity (cosine > 0.92) against existing `questions` table
- [ ] Insert: approved questions -> `questions` table + `examPaperQuestions` join (paperId, questionId, order, marks)
- [ ] "Past Paper Practice" mode: timed exam using real paper questions, P1/P2 split, official time limits
- [ ] Metrics: ingestion throughput (papers/hr), extraction accuracy (human approval rate), duplicate rate

## Technical Details

- Extends `exam-paper-ingestion/` (existing) + `ExamDownloadService` (S37) + `ExamUploadService` (S37)
- QueueCore job type: `"exam-paper-ingest"` with handlers: `ocrExtract`, `aiStructure`, `humanReview`, `persist`
- Dexie v33+: `examPaperIngestQueue` (job state), `examPaperReviews` (human decisions)
- AI prompt: few-shot with 5 gold-standard examples per subject; temperature 0.1; JSON schema output
- OCR: Tesseract.js WASM (offline) + Google Cloud Vision fallback (server-side, budget permitting)
- Admin UI: shadcn DataTable + PDF.js viewer + Monaco JSON editor

## Dependencies

- QuestionEngine (AI generation) -- reuse for structuring
- CompetencyEngine (topic mapping) -- CAPS taxonomy needed
- QueueCore (retry/backoff) -- DONE
- Admin auth (magic-link + OTP) -- DONE

## Effort

3-4 sprints (1 backend, 1 AI/ML, 0.5 frontend/admin)
