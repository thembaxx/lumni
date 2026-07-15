# Plan 175: Add "Bookmark All" Button to Quiz/Exam Results

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/components/exam/session-results-view.tsx src/lib/bookmark-service/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Users who want to save all questions from a quiz or exam session for later review must bookmark each question individually. The session's questions are already in memory at results time — adding a batch "Bookmark all" or "Bookmark wrong answers only" button eliminates friction. This is especially valuable for exam results where students want to save and revisit entire question sets.

## Current state

In `src/components/exam/session-results-view.tsx`, buttons include "Review Mistakes" and "Share Result" but no bookmark-all action.

`src/lib/bookmark-service/service.ts` has `add()`, `remove()`, `updateNote()` but no `bulkAdd()` method for batch operations.

The Zustand bookmark store at `src/store/bookmarks.ts` has `toggleBookmark()` which wraps the service's `add()/remove()`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/bookmark-service/service.ts` — add `bulkAdd()`
- `src/lib/bookmark-service/types.ts` — check if types need updating
- `src/components/exam/session-results-view.tsx` — add buttons
- Quiz results view file (find parallel location)

## Steps

### Step 1: Add `bulkAdd` method to bookmark service

In `src/lib/bookmark-service/service.ts`, add a `bulkAdd` method:

```typescript
async bulkAdd(items: Array<{ questionId: string; subjectId: string; questionText: string }>): Promise<void> {
  await this.db.bookmarks.bulkAdd(
    items.map(item => ({
      ...item,
      createdAt: new Date(),
    }))
  );
}
```

Use the existing `DexieBookmarkService` pattern — it already uses `this.db.bookmarks`. The `bulkAdd` uses Dexie's `bulkAdd` for performance.

### Step 2: Add buttons to session results view

In `src/components/exam/session-results-view.tsx`, add two buttons alongside "Review Mistakes":

1. "Bookmark all questions" — bookmarks every question in the session
2. "Bookmark wrong answers" — bookmarks only wrong-answer questions

These call `bookmarkService.bulkAdd()` with the appropriate question list. Use the existing button style pattern from the same file.

### Step 3: Find and update the quiz results view

Find the parallel quiz results UI (likely at `src/components/quiz/` or `src/app/[locale]/quiz/`). Apply the same buttons there. Use grep to find both results views: `rg "Review Mistakes" src/components/`.

**Verify**: `rg "Bookmark all" src/components/` → 2+ matches (exam + quiz views)

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Add tests for the new `bulkAdd` method in the bookmark service test file. Test: bulk add succeeds, partial failure handling (if one fails, others still save). Follow the existing test pattern in `src/lib/bookmark-service/__tests__/`.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0; new tests for `bulkAdd` exist
- [ ] `bookmarkService.bulkAdd()` accepts array of bookmark items
- [ ] "Bookmark all questions" button on exam results view
- [ ] "Bookmark wrong answers" button on both exam and quiz results views
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The bookmark service structure differs from the excerpt
- Session results view doesn't have access to the full question list
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

The buttons should be visually consistent with the existing "Review Mistakes" button. If the results view doesn't have access to question data at render time (e.g., questions are streamed), bookmarking may need to happen through a separate data flow.
