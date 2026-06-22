# NSC Exam Engine — Design Spec

## Overview

Integrate a complete National Senior Certificate (NSC) Exam Engine into the Lumni app. The engine parses Grade 12 exam papers from Markdown into structured JSON and renders them as interactive digital exams.

**Key principle:** No local files in the repo. Everything goes through **Admin upload → UploadThing → Server-side conversion → Appwrite metadata**.

---

## Architecture

```
Admin Page (/admin, Exam tab)
  └─ Drag-and-drop PDF upload → UploadThing
       └─ Server-side Pipeline (API route)
            ├─ Download PDF from UploadThing
            ├─ Convert PDF → Markdown (via @opendataloader/pdf)
            ├─ Parse Markdown → JSON (via MarkdownExamParser)
            └─ Upload both .md + .json to UploadThing
                 └─ Save metadata to Appwrite (single source of truth)
                      └─ Dexie IndexedDB (client-side cache)

Page Route: /exam/[id]
  └─ Fetch: Appwrite (list/metadata) → UploadThing (parsed JSON) → Dexie (cache)
  └─ Exam Engine (React Components)
       ├─ Header (subject, paper, timer, marks)
       ├─ Sidebar (question navigator with status badges)
       └─ Main Content (renders current question part)
            └─ Inputs (per question type, 11 total)
  └─ Zustand Store (exam session state)
       └─ Persistence Layer
            ├─ Dexie IndexedDB (fast, offline saves)
            └─ Appwrite DB (cross-device session sync)
```

### Data Flow

```
UPLOAD:  PDF → UploadThing → API Route (convert) → .md + .json → UploadThing, metadata → Appwrite
FETCH:   /exam/[id] → API route → Appwrite (get file keys) → UploadThing (get JSON) → Return
TAKE:    /exam/[id] → Load JSON → Zustand → Dexie (answers) + Appwrite (session)
```

---

## Data Model

### New file: `src/types/exam-paper.ts`

All NSC spec interfaces exactly:

- `ExamPaper` → `PaperMetadata` (subject, paperCode, examPeriod, year, grade, qualification, language, totalMarks, duration, pageCount)
- `Section` (id, title, instructions, questions)
- `Question` (id, title, context, parts, totalMarks)
- `QuestionPart` (id, text, content, marks, answerFormat, type, options, table, sourceRefs, subParts)
- `ContentBlock` (type: text | image | table | formula | code, value, imagePath, altText, tableData, language)
- `DataTable` (headers, rows)
- `Option` (id, text)
- `QuestionType` = "multiple-choice" | "matching" | "short-answer" | "long-answer" | "essay" | "calculation" | "diagram" | "source-based" | "programming" | "data-response" | "mixed"

### New file: `src/types/exam-session.ts`

```typescript
interface ExamSessionData {
  id: string;
  examPaperId: string;
  userId: string;
  startedAt: string;
  lastSavedAt: string;
  timeRemaining: number;
  completed: boolean;
  answers: Record<string, ExamAnswer>;
  flags: string[];
}

interface ExamAnswer {
  value: string | string[];
  answeredAt: string;
}
```

### Appwrite `exam_papers` collection (extends existing)

```typescript
{
  id: string,
  subject: string,          // "Geography"
  paperCode: string,        // "P1"
  examPeriod: string,       // "November 2025"
  year: number,
  grade: number,            // 12
  language: string,         // "English" | "Afrikaans"
  totalMarks: number,
  duration: string,         // "3 hours"
  fileKeys: {              // UploadThing references
    pdf: string,
    markdown: string,
    json: string
  },
  uploadedAt: string,
  uploadedBy: string
}
```

No changes to existing `src/types/exam.ts` (upload model — will be deprecated) or `src/types/questions.ts` (Question Engine types).

---

## Parser Module

**Location:** `src/lib/exam-parser/`

Files:

- `src/lib/exam-parser/index.ts` — Public API, `convertMarkdownToJson()`
- `src/lib/exam-parser/markdown-exam-parser.ts` — `MarkdownExamParser` class (moved from `scripts/markdown-to-json.ts`, enhanced)

**Enhancements to existing parser:**

1. `answerFormat` field based on detected type
2. `context` on Question: extract source materials/tables before sub-questions
3. `subParts` nesting: `(a)`, `(b)` as subParts of parent
4. Code blocks: \`\`\` fences → `ContentBlock { type: "code" }`
5. Formula blocks: `$$...$$` → `ContentBlock { type: "formula" }`
6. Matching columns: Y/Z pairs → `type: "matching"`
7. Better source ref extraction (entire body)
8. Better inline marks: `(1 x 2)`, `(4 x 1) (4)`

---

## Admin Upload Pipeline

### New API route: `POST /api/admin/exams/upload`

```
1. Receive: fileKey (UploadThing key for uploaded PDF)
2. Download PDF from UploadThing (using UTApi)
3. Convert PDF → Markdown (using @opendataloader/pdf)
4. Parse Markdown → JSON (using MarkdownExamParser)
5. Upload .md file to UploadThing
6. Upload .json file to UploadThing
7. Save to Appwrite: { subject, paperCode, year, language, totalMarks, duration, fileKeys: { pdf, markdown, json } }
8. Return: success + exam metadata
```

### New API route: `GET /api/admin/exams`

List all exam papers from Appwrite.

### New API route: `DELETE /api/admin/exams/[id]`

Delete exam paper from Appwrite + all 3 artifacts from UploadThing.

### Admin UI Components (new)

Added to existing admin-dashboard.tsx Exam tab:

| Component                    | Purpose                                                                       |
| ---------------------------- | ----------------------------------------------------------------------------- |
| `admin-exam-upload-zone.tsx` | Drag-and-drop zone using `@uploadthing/react` `UploadButton`/`UploadDropzone` |
| `admin-exam-list.tsx`        | Table/cards showing uploaded exams with status (processing/done/error)        |
| `admin-exam-row.tsx`         | Single exam row with delete, view on engine link                              |

**Flow in the Exam tab:**

1. Admin sees existing Download/Upload buttons (can be removed or kept)
2. New drag-and-drop zone below for uploading PDFs
3. Upload progress shown inline
4. After upload completes, conversion runs server-side (poll for status or webhook)
5. Exam appears in the list below

---

## Exam Engine (Renderer)

### Component Tree

```
src/components/exam/
├── exam-engine.tsx              # Top-level orchestrator
├── exam-layout.tsx              # 3-column layout
├── exam-header.tsx              # Subject, paper, timer, marks
├── exam-sidebar.tsx             # Question navigator with badges
├── exam-timer.tsx               # Countdown
├── exam-submit-dialog.tsx       # Submit confirmation
├── exam-results.tsx             # Score breakdown
├── question-renderer.tsx        # Renders Question header + parts
├── part-renderer.tsx            # Routes to input by type
├── content-block-renderer.tsx   # Renders text/image/table/formula/code
├── marks-display.tsx            # (2), (2 x 2), etc.
├── inputs/
│   ├── multiple-choice-input.tsx
│   ├── matching-input.tsx
│   ├── short-answer-input.tsx
│   ├── long-answer-input.tsx
│   ├── essay-input.tsx
│   ├── calculation-input.tsx
│   ├── diagram-input.tsx
│   ├── source-based-input.tsx
│   ├── programming-input.tsx
│   ├── data-response-input.tsx
│   └── mixed-input.tsx
└── index.ts
```

### Content Block Rendering

| Block   | Implementation                             |
| ------- | ------------------------------------------ |
| text    | `<p>` with preserved whitespace            |
| image   | `<img>` with `alt`                         |
| table   | shadcn `<Table>` (TableHeader + TableBody) |
| formula | Existing `<Equation>` (KaTeX)              |
| code    | `<SyntaxHighlighter>` with language        |

### Layout

- **Desktop**: Fixed sidebar (240px), header bar, scrollable main
- **Mobile**: Sidebar as vaul drawer, collapsed header

---

## State Management

### Zustand Store: `src/store/exam-session.ts`

State: paper, sessionId, answers, flags, currentPartId, timeRemaining, startedAt, completed, isSubmitting

Actions: initSession, setAnswer, toggleFlag, setCurrentPart, tick, submitExam, resetSession, restoreSession

### Persistence

| Layer           | Mechanism                  | Behavior                                                       |
| --------------- | -------------------------- | -------------------------------------------------------------- |
| Dexie IndexedDB | `exam_sessions` table      | Auto-save answers (debounced 2s), timer (10s), restore on load |
| Appwrite DB     | `exam_sessions` collection | Sync after Dexie (every 30s), cross-device fallback            |

---

## API Routes

| Method | Route                     | Purpose                                                         |
| ------ | ------------------------- | --------------------------------------------------------------- |
| POST   | `/api/admin/exams/upload` | Upload PDF → convert → save all artifacts + metadata            |
| GET    | `/api/admin/exams`        | List all exam papers                                            |
| DELETE | `/api/admin/exams/[id]`   | Delete exam + artifacts                                         |
| GET    | `/api/exam-papers/[id]`   | Fetch parsed ExamPaper JSON (from UploadThing via Appwrite key) |
| GET    | `/api/exam-sessions`      | List user exam sessions                                         |
| POST   | `/api/exam-sessions`      | Save/update session                                             |
| GET    | `/api/exam-sessions/[id]` | Get session for restore                                         |
| DELETE | `/api/exam-sessions/[id]` | Delete session                                                  |
| POST   | `/api/exam-engine/submit` | Submit + score breakdown                                        |

---

## What Gets Removed/Deprecated

| File                                                  | Status          | Reason                                    |
| ----------------------------------------------------- | --------------- | ----------------------------------------- |
| `src/lib/db/exams/index.ts`                           | Remove          | SQLite replaced by Appwrite               |
| `src/lib/db/exams/schema.ts`                          | Remove          | No longer needed                          |
| `src/lib/exams/sync-exam-papers.ts`                   | Remove          | No local files to sync                    |
| `src/data/exams/index.json`                           | Remove          | Data moves to Appwrite                    |
| `src/app/api/admin/download-exam-papers/route.ts`     | Remove          | Replaced by admin upload UI               |
| `src/app/api/admin/upload-local-exam-papers/route.ts` | Remove          | Replaced by admin upload UI               |
| `src/lib/server/exam-paper-actions.ts`                | Remove          | Logic moved to new API + Appwrite         |
| `scripts/pdt-to-mkdwn.ts`                             | Keep            | Still useful for ad-hoc conversions       |
| `scripts/markdown-to-json.ts`                         | Keep as wrapper | Thin CLI wrapper over `@/lib/exam-parser` |

---

## Routing

**New page:** `src/app/exam/[id]/page.tsx`

Flow: Upload → Admin manages exams → User clicks exam card → `/exam/[id]` → Engine loads from Appwrite + UploadThing → Answers → Submit → Results

---

## Integration Points

1. **`admin-dashboard.tsx`** — Replace existing Exam tab (Download/Upload buttons) with drag-and-drop zone + exam list
2. **`exam-card.tsx`** — Add "Take Exam" button linking to `/exam/[id]`
3. **`practice-sheet.tsx`** — Ensure exam cards pass correct `id` from Appwrite
4. **`use-exams.ts`** — Update to fetch from Appwrite instead of SQLite
5. **New hooks:** `use-exam-paper.ts` (React Query), `use-exam-session.ts` (React Query), `use-admin-exams.ts` (React Query)
6. **UploadThing `core.ts`** — Add new file types if needed (`.md`, `.json`)

---

## Implementation Order

1. **Types** — `src/types/exam-paper.ts`, `src/types/exam-session.ts`
2. **Parser** — Move to `src/lib/exam-parser/`, apply enhancements
3. **Appwrite collection** — Define `exam_papers` schema, seed migration
4. **Admin upload API** — `POST /api/admin/exams/upload` with PDF→md→json pipeline
5. **Admin upload UI** — Drag-and-drop zone + exam list in existing Exam tab
6. **Cleanup** — Remove deprecated files (SQLite, old scripts, old routes)
7. **Exam paper API** — `GET /api/exam-papers/[id]` serving parsed JSON
8. **State store** — Zustand + Dexie + Appwrite persistence
9. **Exam engine components** — Build bottom-up (content-block → part → question → layout → engine)
10. **Page route** — `/exam/[id]`
11. **Session API** — CRUD for exam sessions
12. **Integration** — Wire into exam cards, update hooks
13. **Submit + results** — Grading and score breakdown
