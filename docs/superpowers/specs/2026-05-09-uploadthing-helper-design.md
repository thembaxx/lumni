# UploadThing Programmatic Upload Dialog — Design Spec
**Date:** 2026-05-09
**Author:** opencode agent

## Overview

A programmatic upload helper that accepts `File` objects, shows a shadcn dialog with file info + progress, and returns upload results. Uses `@uploadthing/react`'s `useUploadThing` hook internally.

## Architecture

### Files to create/modify

| File | Purpose |
|------|---------|
| `src/hooks/use-upload-dialog.ts` | Core hook wrapping `useUploadThing` |
| `src/components/upload/upload-dialog.tsx` | Dialog UI with file list + progress |
| `src/components/upload/upload-file-item.tsx` | Individual file row component |
| `src/lib/uploadthing-helpers.ts` | Public API: `uploadFiles()` function |
| `src/app/api/uploadthing/core.ts` | Add a `generalUploader` route |

### Hook: `useUploadDialog`

```ts
function useUploadDialog() {
  open(files: File[], endpoint: string): void;
  close(): void;
  results: UploadCompleteFile[];
  errors: UploadError[];
  isUploading: boolean;
  isOpen: boolean;
  progress: number; // 0-100
}
```

Wraps `useUploadThing` from `@uploadthing/react`.

### Dialog UI

- **Header:** "Uploading files" with file count + close button (disabled while uploading)
- **File list:** Each file shows icon, filename, size (formatted), progress bar
- **Per-file states:**
  - `pending` — waiting to upload
  - `uploading` — progress bar fills (0-100%)
  - `complete` — green checkmark + file URL
  - `error` — red X + error message + "Retry" button
- **Footer:** Overall progress label (e.g., "3 of 5 complete") + "Cancel" / "Close" button
- **On complete:** Footer shows "Done" + "Close" button
- **On error:** Error banner at top with message, "Retry All Failed" button

### Public API: `uploadFiles()`

```ts
async function uploadFiles(
  files: File[],
  endpoint?: string,
  options?: { onAllComplete?: (results: UploadCompleteFile[]) => void; }
): Promise<UploadCompleteFile[]>
```

Internally uses the `useUploadDialog` hook. Opens dialog, uploads, returns results. Endpoint defaults to `"generalUploader"`.

### FileRouter: `generalUploader`

Route in `core.ts` supporting multiple file types up to 4MB:

```ts
generalUploader: f(["image", "video", "pdf", "audio", "text"])
  .middleware(async ({ req }) => {
    const user = await requireAuth(req);
    return { userId: user.id };
  })
  .onUploadComplete(async ({ metadata, file }) => {
    return { uploadedBy: metadata.userId };
  }),
```

---

## Exam Paper SQLite Sync

A companion feature that syncs downloaded exam paper PDFs to UploadThing and stores URLs + metadata in a local SQLite database.

### Files created/modified

| File | Purpose |
|------|---------|
| `src/lib/db/exams/schema.ts` | SQLite schema + filename parser + subject name map |
| `src/lib/db/exams/index.ts` | SQLite client (bun:sqlite), CRUD helpers, memo linking |
| `src/lib/exams/sync-exam-papers.ts` | Sync logic: load tracker → read local PDFs → upload to UT → save to SQLite → link memos |
| `src/app/api/exams/route.ts` | GET endpoint for reading exam papers |
| `src/app/api/exams/sync/route.ts` | POST to force sync, GET to check status |
| `src/components/providers/providers.tsx` | Calls `ensureExamPapersSynced()` on every app load |
| `exams.db` | SQLite database (gitignored) |

### Database schema (SQLite)

```sql
exam_papers (
  id TEXT PRIMARY KEY,
  subject_code TEXT,
  subject_name TEXT,
  year INTEGER,
  paper_number INTEGER,
  type TEXT CHECK(type IN ('paper', 'memo')),
  paper_id TEXT,       -- FK from memo → paper
  memo_id TEXT,        -- FK from paper → memo
  file_url TEXT,
  file_key TEXT,
  original_file_name TEXT,
  uploaded_at TEXT
)
```

### Sync flow

1. App loads → `ensureExamPapersSynced()` in `Providers`
2. If `exam_papers` table is empty → loads existing `exam-papers-uploaded.json` tracker
3. Inserts all 58 tracked papers from tracker (sorted: papers first, then memos)
4. Each memo links to its paper via `paper_id`; paper links back via `memo_id`
5. If new local PDFs exist that aren't tracked → uploads them to UploadThing
6. Subsequent loads skip sync (count > 0 guard)

### Memo linking

- `paperId` on memo record, `memoId` on paper record — both directions updated
- Papers inserted first, then memos (sorted by type in tracker loop)

## Dialog Design

- Uses existing `Dialog` component from `@/components/ui/dialog` (base-ui)
- `max-w-sm` width, scrollable file list
- File type icon (file icon for generic, type-specific icons for image/video/pdf/audio)
- Format file size: KB/MB display
- Progress bar uses existing `Progress` component
- Error state: red border-left on file item + error text
- Retry button: small outline button, re-triggers upload for that specific file

## No new dependencies

Uses existing shadcn components: `Dialog`, `Button`, `Progress`, `Badge`.
