# Plan 084: Extend sync push/pull coverage to remaining Dexie tables

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/lib/sync/ src/lib/flashcard-engine/ src/lib/notes/ src/lib/competency/ src/lib/gamification-engine/ src/lib/retention/ src/lib/quiz/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: 080 (sync UX — already DONE)
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

The cross-device sync infrastructure is fully built — `enqueueOutbox()` writes to Dexie outbox, `SyncService.pushOutbox()` sends to `/api/sync/push`, `pullRemote()` fetches from `/api/sync/pull`. But only flashcards call `enqueueOutbox()` — 7 call sites, all in `flashcard-engine/`. Notes, competencies, gamification state, and wrong-answers mutate local Dexie without enqueueing sync entries. Meanwhile `pullRemote()` only covers 4 tables: flashcards, notes, competencies, gamification. Users lose notes, competencies, and progress across devices.

The sync tab in Settings (from plan 080) shows sync status and pending counts, but those counts only reflect flashcard writes. This erodes trust: the UI claims "synced" but most data types are device-local.

## Current state

- `src/lib/sync/outbox.ts:9-24` — `enqueueOutbox()` works correctly; any caller can write any table name
- `src/lib/sync/service.ts:89-96` — `pullRemote()` hardcodes only 4 tables and their accessors:
  ```ts
  const tables = ["flashcards", "notes", "competencies", "gamification"];
  const tableAccessors = {
    flashcards: dexieDataAccess.flashcards,
    notes: dexieDataAccess.notes,
    competencies: dexieDataAccess.competencies,
    gamification: dexieDataAccess.gamification,
  };
  ```
- `src/lib/flashcard-engine/card-ops.ts:44,76,87` — 3 `enqueueOutbox()` calls (create/update/delete card)
- `src/lib/flashcard-engine/engine.ts:205,234,244,254` — 4 `enqueueOutbox()` calls (SM-2 review/update)
- Zero other services call `enqueueOutbox()` — confirmed by grep
- `src/app/api/sync/pull/route.ts` — accepts `?table=` and `?since=` params; appears table-agnostic on the server side

## STOP conditions

- Any existing test for sync services fails after changes
- The `pullRemote()` signature changes (it is called from `trigger()`)
- A DataAccess accessor does not exist for a table you need to add

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test -- sync`         | all pass            |
| Lint      | `pnpm exec biome check --write` | exit 0              |

## Scope

**In scope**:

- `src/lib/notes/service.ts` — add `enqueueOutbox("notes", id, "create"|"update"|"delete", data)` after every put/delete
- `src/lib/competency/service.ts` — add `enqueueOutbox("competencies", ...)` after every `recordResult` / `trackQuestionResult` call
- `src/lib/gamification-engine/service.ts` — add `enqueueOutbox("gamification", ...)` after state mutations
- `src/lib/retention/retention-service.ts` — add `enqueueOutbox("retentionRecurrence", ...)` after recurrence writes
- `src/lib/quiz/quiz-session.ts` — add `enqueueOutbox("quizAttempts", ...)` after session record creation
- `src/lib/sync/service.ts` — expand `tables` + `tableAccessors` in `pullRemote()` to include `retentionRecurrence`, `wrongAnswers`, `chatMessages`, `questionRatings`, `bookmarks`, `examSessions`, `quizAttempts`
- Tests: update existing sync tests or add new ones

**Out of scope**:

- Appwrite server-side handler changes (already table-agnostic)
- Conflict resolution beyond last-write-wins
- Real-time push notifications for sync events
- Sync of cache-only tables (`tinyfishCache`, `sttCache`, `knowledgeGraph`, `studyGuides`)

## Steps

### Step 1: Add enqueueOutbox calls to notes service

Read `src/lib/notes/service.ts`. Find every `put`, `add`, `bulkAdd`, `delete`, `bulkDelete` call that mutates the notes table. After each mutation, call `enqueueOutbox("notes", recordId, operation, data)`. Use `.catch(logError)` — never `await` on enqueue (fire-and-forget, same pattern as flashcard engine).

### Step 2: Add enqueueOutbox calls to competency service

Read `src/lib/competency/service.ts`. Find `recordResult` and `trackQuestionResult`. After the Dexie write, call `enqueueOutbox("competencies", key, "update", record)`. The competency key is usually `{ userId, subjectId, topicId }` — stringify or use a compound key as `recordId`.

### Step 3: Add enqueueOutbox calls to gamification service

Read `src/lib/gamification-engine/service.ts`. The service exposes `updateCounter`, `setCounter`, `checkAndUnlockAchievements` — each mutates `data` on the gamification record. After each Dexie write, enqueue.

### Step 4: Add enqueueOutbox calls to retention service

Read `src/lib/retention/retention-service.ts`. After `scheduleReview` writes to `retentionRecurrence`, enqueue.

### Step 5: Add enqueueOutbox calls to quiz session

Read `src/lib/quiz/quiz-session.ts`. After session creation or update, enqueue `quizAttempts`.

### Step 6: Expand pullRemote table list

In `src/lib/sync/service.ts`, expand the `tables` array and `tableAccessors` map to include these additional tables:

- `retentionRecurrence`
- `wrongAnswers`
- `chatMessages`
- `questionRatings`
- `bookmarks`
- `quizAttempts`
- `examSessions`
- `studyPlans`

Verify each accessor exists in `DataAccess` and both `DexieDataAccess` + `InMemoryDataAccess`.

### Step 7: Run typecheck + tests

Run `pnpm run typecheck` — 0 errors. Run `pnpm run test -- sync` — all pass. Run `pnpm exec biome check --write` — 0 errors on changed files.

## Verification

1. With a seeded Dexie, call `enqueueOutbox("notes", "n1", "update", { title: "test" })` then `getPendingOutboxEntries()` — entry exists
2. `pullRemote()` no longer throws for any table in the expanded list when the server returns empty arrays
3. All existing sync tests pass unchanged (backward-compatible additions only)
