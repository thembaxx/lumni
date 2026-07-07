# Plan 138: Fix exam auto-save fire-and-forget on page unload

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/hooks/use-exam-session-persistence.ts src/lib/quiz-session/use-quiz-session.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: MED | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The exam auto-save calls async `examSessionRepo.save()` without `await` inside `pagehide`/`beforeunload` handlers. The browser may terminate the page before the IndexedDB write completes, causing loss of last-minute answers on timed exams — a critical user-facing data loss bug.

## Current state

`src/hooks/use-exam-session-persistence.ts:31-37`:

```typescript
const handlePageHide = () => persistRef.current();

// persistRef.current() calls examSessionRepo.save() — async, not awaited
// The handler returns void, browser may terminate before write completes
```

`src/lib/quiz-session/use-quiz-session.ts:74-81` has the same pattern for `beforeunload` saves.

The 30s interval saves are fine — async completes before the next interval. Only the unload path is broken.

## Commands you will need

| Purpose   | Command            | Expected on success |
| --------- | ------------------ | ------------------- |
| Typecheck | `pnpm typecheck`   | exit 0, no errors   |
| Tests     | `pnpm test`        | all pass            |
| Lint      | `pnpm exec oxlint` | exit 0              |

## Scope

**In scope**:

- `src/hooks/use-exam-session-persistence.ts`
- `src/lib/quiz-session/use-quiz-session.ts`

**Out of scope**: Other auto-save patterns, exam session store internals.

## Steps

### Step 1: Fix use-exam-session-persistence.ts

In `src/hooks/use-exam-session-persistence.ts`, replace the `handlePageHide` direct-call pattern with `navigator.sendBeacon()`.

Add a `persistSync` function alongside `persist`:

```typescript
const persistSync = useCallback(() => {
  const state = useExamSessionStore.getState();
  if (!paperId || !state.paperId) return;
  try {
    localStorage.setItem(
      `exam_session_backup_${paperId}`,
      JSON.stringify({
        answers: state.answers,
        flags: state.flags,
        currentPartId: state.currentPartId,
        timeRemaining: state.timeRemaining,
        startedAt: state.startedAt ?? Date.now(),
        completed: state.completed,
      }),
    );
  } catch {
    /* quota exceeded — non-critical */
  }
}, [paperId]);
```

Update the event handlers:

```typescript
const handlePageHide = () => persistSync(); // synchronous localStorage
// Keep visibility change using async persist (plenty of time)
// Keep interval using async persist (every 30s)
```

Then initialize `persistSync` in the ref alongside `persist`:

```typescript
const persistSyncRef = useRef(persistSync);
persistSyncRef.current = persistSync;
```

On pagehide/beforeunload, call `persistSyncRef.current()` instead of `persistRef.current()`.

### Step 2: Fix use-quiz-session.ts

In `src/lib/quiz-session/use-quiz-session.ts`, apply the same fix to the `beforeunload` handler: write a synchronous `localStorage` backup of the critical session state (answers, current question index, timer) before the page unloads.

### Step 3: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass.

## Test plan

No automated test for `sendBeacon` / `beforeunload` (browser-only API). Verify manually by opening DevTools → Application → Local Storage, starting an exam, answering some questions, and closing the tab. The `exam_session_backup_*` key should appear in localStorage on pagehide.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] The on-unload save path uses synchronous localStorage or `sendBeacon()` instead of an unawaited async call

## STOP conditions

Stop and report if the exam session persistence hook has been significantly refactored since the plan was written.

## Maintenance notes

- The localStorage backup is a fallback — the primary 30s Dexie save remains unchanged.
- On next page load, `useExamSessionPersistence` should check for and load the localStorage backup if the Dexie save failed.
- The `exam_session_backup_*` key should be cleaned up after successful restore.
