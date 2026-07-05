# Plan 103: OCR exam timetable scraping

> **Executor instructions**: Build a pipeline that automatically scrapes DBE-published exam timetable PDFs using the existing OCR infrastructure and updates the exam dates data. This is a contained build plan (not a spike) — the scope is narrow, the dependencies are known, and the verification is straightforward.
>
> Run every verification command. If anything in "STOP conditions" occurs, stop and report.
>
> **Drift check (run first)**: `git diff --stat a8d53ec7..HEAD -- src/lib/ocr/ src/lib/exam-dates/ src/app/api/exam-dates/ src/lib/services/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M (build: 1 week)
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `a8d53ec7`, 2026-07-05

## Why this matters

Current exam dates are manually entered seed data in `src/lib/exam-dates/data-2026-nov.ts`. When DBE publishes updated timetables (rescheduled exams, venue changes, supplementary dates), the app is stale until a developer manually updates. OCR automation would:

1. Make exam dates self-updating — a trust signal for users who rely on accurate exam schedules
2. Reduce maintenance burden for the development team
3. Enable automatic detection of timetable changes (diff old vs new)
4. Cover IEB and other exam boards in addition to DBE/NSC

Exam dates are a high-visibility feature (exam countdown, notifications, calendar export). Stale data undermines all of them.

## Current state

**OCR infrastructure** (`src/lib/ocr/ocr-service.ts:1-90`):

```typescript
import { createWorker, OEM, PSM, type Worker } from "tesseract.js";

export async function recognizeImage(
  imageData: string | File | Blob,
  mode: "printed" | "handwritten" = "printed",
): Promise<OcrResult> {
  const w = await getWorker();
  // Uses LSTM_ONLY engine, PSM.AUTO for printed text
  // Returns { text, confidence, mode }
}
```

The OCR service uses Tesseract.js with LSTM engine. It supports printed and handwritten modes. Handwritten mode is not needed for timetable scraping.

**Exam dates infrastructure** (`src/lib/exam-dates/`):

- `types.ts` — `ExamSlot` interface (date, subject, session, paper, language)
- `service.ts` — `getExamDates()`, `getSeedData()`, calendar export, Dexie caching
- `data-2026-nov.ts` — manually written seed data
- `subject-maps.ts` — subject color/abbreviation maps
- Calendar export (`calendar-export.ts`)
- Appwrite sync (`syncExamDatesToAppwrite()`)

**Data model** (`ExamSlot` — check types for exact shape):

```
subject: string;
date: string; // ISO date
session: "morning" | "afternoon";
paper?: number;
language?: string;
```

**Existing patterns to follow**:

- API routes use `createRouteHandler` from `@/lib/api/create-route-handler` — see `src/app/api/exam-dates/refresh/route.ts` for the existing refresh pattern
- Rate limiting uses `withRateLimit` or `RateLimiter` — check existing exam-dates routes for which pattern
- Logging uses `logError` from `@/lib/shared/logger`
- OCR uses `recognizeImage()` from `@/lib/ocr/ocr-service`

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Install   | `pnpm install`       | exit 0              |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/lib/exam-dates/pdf-scraper.ts` — new module: download DBE timetable PDF → OCR → structured `ExamSlot[]`
- `src/app/api/exam-dates/scrape/route.ts` — new API endpoint: trigger scrape + persist results
- `src/lib/exam-dates/__tests__/pdf-scraper.test.ts` — unit tests with mock PDF data
- Integration with existing `syncExamDatesToAppwrite()` to sync scraped data

**Out of scope**:

- Scraping IEB or other exam board timetables (design the extension point, don't implement)
- Automatic daily scheduling of scrape (leave as manual/admin-triggered for now)
- Diff/change detection between scraped versions
- Handling scanned (non-digital) PDFs with complex layouts

## Steps

### Step 1: Create the PDF scraper module

Create `src/lib/exam-dates/pdf-scraper.ts`:

```typescript
export interface ScrapeResult {
  slots: ExamSlot[];
  source: string; // URL or filename
  scrapedAt: string; // ISO timestamp
  confidence: number; // average OCR confidence
}
```

The scraper should:

1. **Fetch the PDF**: Accept a URL pointing to a DBE timetable PDF. Use `fetch()` (Node 18+). The DBE publishes at predictable URLs — use the DBE's official timetable URL pattern. For this prototype, accept any PDF URL as input.
2. **Convert PDF to images**: Use `sharp` (already in deps at `^0.35.2`) or the existing `@opendataloader/pdf` (`^2.4.7`) to render PDF pages as images. Check `src/lib/exam-paper-ingestion/` for existing PDF-to-image patterns.
3. **OCR each page**: Call `recognizeImage()` for each page image. Collect raw text.
4. **Parse structured data**: Parse OCR text into `ExamSlot[]`. DBE timetable format is tabular: columns for date, time, subject, paper, language. Design the parser to handle the standard DBE format (rows with whitespace-delimited or newline-delimited columns). This will be format-specific and may need iteration.
5. **Return results**: Include source URL, scraped timestamp, and average OCR confidence.

The DBE publishes timetable PDFs with a predictable structure. The parser should look for:

- Date patterns: `\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}`
- Session indicators: "Morning" / "Afternoon" or "08:30" / "14:00"
- Subject codes/names aligned under column headers
- Multiple pages for the full timetable

**Verify**: `pnpm run typecheck` exits 0. Unit test with a mock OCR text resembling DBE timetable output.

### Step 2: Create the scrape endpoint

Create `src/app/api/exam-dates/scrape/route.ts`:

```typescript
// POST /api/exam-dates/scrape
// Body: { url: string; session: string; year: number }
// Rate limited: 5/hour (same as existing refresh endpoint)
// Auth required: admin only

export const POST = createRouteHandler({
  auth: "required",
  validate: (body) => {
    if (!body.url) return "url required";
    if (!body.session) return "session required";
    if (!body.year) return "year required";
    return null;
  },
  execute: async ({ body }) => {
    const result = await scrapePdf(body.url);
    // Validate parsed slots
    // Sync to Dexie cache
    // Sync to Appwrite
    return { slots: result.slots.length, confidence: result.confidence };
  },
});
```

Follow the rate limiting pattern from `src/app/api/exam-dates/refresh/route.ts` — examine that file for the exact pattern.

**Verify**: `pnpm run typecheck` exits 0. `curl -X POST http://localhost:3000/api/exam-dates/scrape -H "Content-Type: application/json" -d '{"url":"https://example.com/timetable.pdf","session":"oct-nov","year":2027}'` returns a response.

### Step 3: Write tests

Create `src/lib/exam-dates/__tests__/pdf-scraper.test.ts`:

- **Mock OCR success**: Feed a simulated OCR text matching DBE timetable format, verify correct `ExamSlot[]` extraction
- **Empty/format mismatch**: Feed garbage text, verify graceful fallback (return empty array, not crash)
- **Partial parse**: Feed text with some parseable and some unparseable rows, verify partial results with error report
- **Confidence threshold**: Verify slots below minimum confidence are excluded

Model tests after existing exam-dates tests in `src/lib/exam-dates/__tests__/`.

**Verify**: `pnpm run test -- src/lib/exam-dates` passes all tests, including at least 4 new ones.

### Step 4: Wire into existing exam-dates system

The scraped data should flow through the existing pipeline:

1. Call `syncExamDatesToAppwrite()` after successful scrape (follows pattern from `refresh/route.ts`)
2. Update Dexie cache (existing `getExamDates()` reads from Dexie → seed data fallback — scraped data should be inserted as Dexie cache with high priority)
3. Add a "Last scraped" timestamp to the exam dates admin or info display

**Verify**: After a scrape run, `getExamDates()` returns the scraped slots (overriding seed data).

## Test plan

New file: `src/lib/exam-dates/__tests__/pdf-scraper.test.ts` (create)

| Test                           | Description                                             | Expected                  |
| ------------------------------ | ------------------------------------------------------- | ------------------------- |
| Parses standard DBE timetable  | Simulated OCR text with 3 dates, 2 sessions, 4 subjects | Returns 4 slots           |
| Handles empty/unparseable text | Empty string or random characters                       | Empty array, no crash     |
| Filters low-confidence rows    | Row with `confidence < 0.5`                             | Row excluded from output  |
| Handles multi-page input       | Two page texts concatenated                             | All slots from both pages |
| Date format variants           | "2 Nov 2026" and "02 November 2026"                     | Both parse correctly      |

## Done criteria

ALL must hold:

- [ ] `src/lib/exam-dates/pdf-scraper.ts` exists and exports `scrapePdf(url)` function
- [ ] `src/app/api/exam-dates/scrape/route.ts` exists and returns `{ slots, confidence }`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/lib/exam-dates` passes, including ≥4 new PDF scraper tests
- [ ] `pnpm exec oxlint` exits 0
- [ ] Scraped data flows into existing `getExamDates()` pipeline

## STOP conditions

Stop and report back if:

- The DBE timetable PDF URL is not publicly accessible or has changed format (check online first — DBE publishes at `https://www.education.gov.za` under Examinations)
- The PDF requires complex table parsing (merged cells, split columns, rotated text) that Tesseract cannot handle alone
- `sharp` or `@opendataloader/pdf` cannot render PDF pages to images for OCR input (test with a sample PDF page first)
- The average OCR confidence on real DBE timetable PDFs is below 0.5 (fragile pipeline — document and defer)

## Maintenance notes

- DBE timetable formats change occasionally. The parser in `pdf-scraper.ts` should have a `formatVersion` field to allow switching between parsing strategies.
- Consider adding a "diff" step in a future iteration: compare newly scraped data with existing `ExamSlot[]`, flag changes, and notify admin via push notification.
- IEB publishes timetable PDFs with a different format. When adding IEB support, create a separate parser function and dispatch based on source URL pattern.
- The scrape endpoint is admin-only and rate-limited. If automated (cron), create a separate internal endpoint that bypasses auth but enforces stricter rate limits.
