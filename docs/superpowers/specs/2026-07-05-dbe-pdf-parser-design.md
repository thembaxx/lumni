# DBE PDF Timetable Parser — Design

## Goal

Automatically extract structured exam slot data from South African DBE Matric exam timetable PDFs, replacing the current hardcoded seed data pipeline.

## PDF Extraction Approach

### Two-tier strategy

1. **Searchable PDFs (first attempt)**: Use `pdf-parse` (already in deps via `@opendataloader/pdf`) to extract text per page. The DBE timetable uses a predictable column layout — dates on the left, subject/time columns to the right. Text extraction is reliable for electronically-generated PDFs.

2. **Scanned PDFs (OCR fallback)**: When text extraction yields <50 chars of meaningful content, fall back to Tesseract.js OCR. Uses the existing `tryLocalOcr` wrapper from `src/lib/ocr/local-ocr.ts`.

### Regex-based parsing (deterministic, not AI)

The parser avoids AI for the common case. DBE timetables follow a consistent format since 2020:

```
Date: 13 October 2025
09:00  12:00  English Home Language Paper 1
14:00  17:00  Mathematics Paper 2
```

**Regex patterns used**:

| Pattern                   | Purpose                   |
| ------------------------- | ------------------------- |
| `\d{2}\s+(Month)\s+\d{4}` | Date header detection     |
| `(\d{2}):(\d{2})`         | Time token identification |
| `(.*?)\s+Paper\s*(\d+)`   | Subject/paper extraction  |
| `(.*?)\s+P\s*(\d+)`       | Short form subject/paper  |

### Subject abbreviation map

A static `SUBJECT_ABBR_MAP` normalises common abbreviations (e.g. `"eng hl"` → `"English Home Language"`, `"phy"` → `"Physical Sciences"`). Covers ~25 subjects from the SA curriculum.

## OCR Fallback Strategy

When the PDF is scanned:

1. Use `pdf-parse` to detect page count
2. Render first 5 pages as images (using a PDF rendering library)
3. Run Tesseract.js on each page image
4. Combine OCR text with page break markers
5. Re-run the same regex parser on the combined text

**Current limitation**: Page-to-image rendering is stubbed (`extractPageAsImage` returns empty). In the prototype, OCR fallback will only trigger if `tryLocalOcr` is callable by some other mechanism. For production, integrate `pdfjs-dist` rendering canvas or `sharp` for PDF→image conversion.

## Type System

All parsers output the existing `ExamSlot` type:

```typescript
interface ExamSlot {
  id: string;
  subject: string;
  subjectId: string;
  paperNumber: number;
  session: "may-june" | "oct-nov";
  year: number;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationHours: number;
  isSC?: boolean;
}
```

Plus a `DbeParseResult` wrapper with warnings and method metadata.

## File Structure

```
src/lib/exam-dates/
  dbe-pdf-parser.ts      — DBE-specific PDF+OCR parser
  text-timetable-parser.ts — paste-friendly text parser
  pdf-text.ts            — low-level PDF text extraction (existing)
  timetable-parser.ts    — AI-based parser (existing)
  types.ts               — ExamSlot + helpers (existing)
```

## Edge Cases

| Case                       | Handling                                                        |
| -------------------------- | --------------------------------------------------------------- |
| Merged cells in table      | Regex tolerates extra whitespace between columns                |
| Multi-page timetable       | Pages concatenated with separators; date lines carry forward    |
| "SC" marking on entries    | `isSC` flag available but not auto-detected in regex (deferred) |
| AM/PM notation             | DBE uses 24h format; no handling needed                         |
| Non-standard subject names | Falls through to raw string if not in abbreviation map          |
| Empty/whitespace pages     | Skipped during text extraction                                  |
