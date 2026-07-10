# Plan 149: Fix bookmark updateNote unhandled promise rejection

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 82a850d3..HEAD -- src/store/bookmarks.ts`
> If the file changed since this plan was written, compare the "Current state"
> excerpts against the live code before proceeding; on a mismatch, treat it as
> a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: correctness
- **Planned at**: commit `82a850d3`, 2026-07-10

## Why this matters

In `src/store/bookmarks.ts`, `addBookmark` and `removeBookmark` both handle
errors with `.catch()` that rolls back the optimistic state. But `updateNote`
(line 109) calls `bookmarkService.updateNote(id, note)` without `await` or
`.catch()`. If the Dexie write fails, an unhandled promise rejection fires
and the in-memory state drifts from storage.

## Current state

`src/store/bookmarks.ts` lines 105-110:

```typescript
  updateNote: (id, note) => {
    set({
      bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, note } : b)),
    });
    bookmarkService.updateNote(id, note);  // no await, no .catch()
  },
```

Compare with `addBookmark` (lines 55-63):

```typescript
  addBookmark: async (question, note) => {
    const prev = get().bookmarks;
    set({ bookmarks: [...get().bookmarks, { ...question, note }] });
    try {
      await bookmarkService.add(question, note);
    } catch {
      set({ bookmarks: prev });  // rollback
    }
  },
```

Note: the `import` for `bookmarkService` is at the top of the file.
The logger import (`logError`) is already available.

## Scope

**In scope**:

- `src/store/bookmarks.ts` — add error handling to `updateNote`

**Out of scope**:

- Do NOT change `addBookmark` or `removeBookmark` (they already have error handling)
- Do NOT change the bookmark Service class

## Git workflow

- Branch: `advisor/149-bookmark-updatenote-fix`
- Commit message: `fix: add error handling to bookmark updateNote`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Add error handling to updateNote

Change the `updateNote` function from:

```typescript
  updateNote: (id, note) => {
    set({
      bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, note } : b)),
    });
    bookmarkService.updateNote(id, note);
  },
```

to:

```typescript
  updateNote: async (id, note) => {
    const prev = get().bookmarks;
    set({
      bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, note } : b)),
    });
    try {
      await bookmarkService.updateNote(id, note);
    } catch (err) {
      set({ bookmarks: prev });
      logError("Bookmarks.updateNote", err);
    }
  },
```

Note: the function becomes `async`. The Zustand store permits async actions.

**Verify**: `pnpm run typecheck` → exit 0, no errors.

## Test plan

No new tests needed — the pattern is identical to `addBookmark` and
`removeBookmark` which already exist and work.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, no regressions
- [ ] `pnpm exec oxlint` — zero warnings on changed files
- [ ] `grep -n 'async.*updateNote' src/store/bookmarks.ts` returns match (function is now async)
- [ ] `grep -n 'catch.*err' src/store/bookmarks.ts` returns 3 matches (one per async method)
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- The Zustand store pattern at the top of `bookmarks.ts` expects synchronous actions only. Check if any existing store actions use `async` — `addBookmark` already does, so this pattern is safe.
- `logError` is not imported in `bookmarks.ts`. If missing, add: `import { logError } from "@/lib/shared/logger";`

## Maintenance notes

- All three async bookmark mutations now use the same pattern (optimistic update + rollback + logError).
