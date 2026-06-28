# Plan 058: Cross-device Progress Sync — Competencies, Flashcards, Retention

> **Executor instructions**: Design/spike plan. Investigate and prototype the
> sync layer for the 3 most-important device-local data types. Do not build
> full conflict resolution or migration tooling — define the sync contracts,
> implement the Appwrite write path, and verify with integration tests.
>
> **Drift check (run first)**: `git diff --stat 169d3704..HEAD -- src/lib/competency/ src/lib/flashcard-engine/ src/lib/retention/ src/lib/sync/`
> If any in-scope file changed, compare excerpts against live code before
> proceeding; on mismatch, treat as STOP condition.

## Status

- **Priority**: P2
- **Effort**: L (4-5 days)
- **Risk**: MED — data loss or sync conflicts if not carefully sequenced
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `169d3704`, 2026-06-28

## Why this matters

Students use Lumni on phones (school, commute) and laptops (home, library). Currently each device has its own Dexie — competency scores, SM-2 flashcard state, and retention-recurrence data are all device-local. A student who reviews 20 flashcards on their phone sees zero progress when they open their laptop. This is the #1 UX gap for the core learning loop.

The sync infrastructure already exists: `sync-handlers.ts` iterates 8 Dexie tables and enqueues per-record Appwrite sync jobs. But `competencies`, `flashcards`, and `retentionRecurrence` are NOT in that list — they're missing the Appwrite write path.

## Current state

- `src/lib/sync/sync-handlers.ts` — `flushOfflineData()` iterates 8 tables: `progress`, `quizAttempts`, `competencies`, `flashcards`, `wrongAnswers`, `chatMessages`, `questionRatings`, `bookmarks`. BUT `competencies` and `flashcards` are in the iteration list without functioning Appwrite write handlers (they hit the `enqueue()` path but there's no corresponding job handler registered for their types).
- `CompetencyService` at `src/lib/competency/service.ts` — uses `DataAccess` (local Dexie only). No sync-on-write.
- `FlashcardEngine` at `src/lib/flashcard-engine/` — uses `DataAccess`, SM-2 state is entirely local.
- `RetentionService` at `src/lib/retention/` — retention-recurrence data is Dexie-only.
- The sync job pattern is proven: `appwrite-exam-dates-sync` in `sync-handlers.ts` registers `upsertDocument` handlers. Same pattern for `appwrite-progress-sync`, `appwrite-quiz-attempts-sync`, etc.
- Appwrite collections exist: `competencies`, `flashcards`, `wrongAnswers` are in `COLLECTIONS` but may lack proper schema/indexes for sync.

## Commands you will need

| Purpose   | Command                          | Expected on success |
|-----------|----------------------------------|---------------------|
| Install   | `pnpm install`                   | exit 0              |
| Typecheck | `pnpm run typecheck`             | exit 0, no errors   |
| Tests     | `pnpm run test -- sync-handler\|competency\|flashcard` | all pass |
| Lint      | `pnpm exec oxlint`               | exit 0              |

## Scope

**In scope**:
- `src/lib/sync/sync-handlers.ts` — add working job handlers for `competencies`, `flashcards`, `retentionRecurrence`
- `src/lib/competency/service.ts` — add `syncToAppwrite()` method or wire into existing sync flow
- `src/lib/flashcard-engine/` — add sync-compatible serialization (SM-2 state → flat JSON for Appwrite)
- `src/lib/retention/` — add sync path for retention-recurrence records
- `src/lib/sync/__tests__/` — integration tests for new handlers
- Dexie schema: no changes needed (existing `$updatedAt` field or add one for conflict detection)

**Out of scope**:
- Real-time sync (push from Appwrite → other devices) — reading from Appwrite on app start is sufficient for Phase 1
- Conflict resolution beyond last-write-wins
- Sync UI (progress indicator, conflict badge, last-sync timestamp) — future
- Full offline mutation queue for these tables — the existing sync queue pattern works

## Steps

### Step 1: Audit existing Appwrite collections and job handlers

Read and record the current state:

1. What job handler types exist in `sync-handlers.ts`? (grep for `case "appwrite-`)
2. What Appwrite collections exist for `competencies`, `flashcards`, `wrongAnswers`? (check `COLLECTIONS` in `src/lib/appwrite/` constants)
3. Do these collections have `$id`, `userId` fields and proper indexes?

**Verify**: Document the gap — list which collections have working handlers and which don't.

### Step 2: Register job handlers for competencies sync

In `sync-handlers.ts`, add:

```typescript
case "appwrite-competencies-sync": {
  const { userId, competency } = payload;
  await upsertDocument("competencies", {
    userId,
    subjectId: competency.subjectId,
    topicId: competency.topicId,
    score: competency.score,
    level: competency.level,
    bloomLevel: competency.bloomLevel,
    paperId: competency.paperId,
    updatedAt: competency.updatedAt ?? new Date().toISOString(),
    // Use userId+topicId+paperId as composite document ID: `${userId}_${topicId}_${paperId}`
  }, { documentId: `${userId}_${competency.topicId}_${competency.paperId ?? "default"}` });
  break;
}
```

Follow the exact pattern of existing `appwrite-progress-sync` handler.

**Verify**: `pnpm run typecheck` → exit 0

### Step 3: Register job handlers for flashcard sync

Flashcard SM-2 state needs flat serialization. Add a helper in `sync-handlers.ts`:

```typescript
function serializeFlashcardForSync(flashcard: Flashcard) {
  return {
    userId: flashcard.userId,
    questionId: flashcard.questionId,
    ease: flashcard.ease,
    interval: flashcard.interval,
    repetitions: flashcard.repetitions,
    nextReviewAt: flashcard.nextReviewAt,
    lastReviewAt: flashcard.lastReviewAt,
    quality: flashcard.quality,
    // ... any other SM-2 fields used by FlashcardEngine
  };
}
```

Then register `case "appwrite-flashcard-sync"` that serializes and upserts.

**Verify**: `pnpm run typecheck` → exit 0. `grep -rn "appwrite-flashcard-sync" src/lib/sync/` shows the handler.

### Step 4: Register retention-recurrence sync handler

Follow the same pattern for `retentionRecurrence`. These records track which wrong answers are scheduled for review — without sync, a student who marks "review later" on their phone won't see those questions on their laptop.

**Verify**: `pnpm run typecheck` → exit 0

### Step 5: Add sync-on-write to CompetencyService

In `CompetencyService.update()` (or `trackQuestionResult()`), after writing to Dexie, enqueue a sync job:

```typescript
import { enqueue } from "@/lib/orchestrator/job-queue";

// After Dexie write:
try {
  await enqueue("appwrite-competencies-sync", { userId, competency });
} catch {
  // Fail open — sync is best-effort
}
```

Use the same fail-open pattern as existing sync paths.

**Verify**: `pnpm run typecheck` → exit 0

### Step 6: Add sync-on-write to FlashcardEngine

In `FlashcardEngine.update()` or `reviewFlashcard()`, after writing to Dexie, enqueue a flashcard sync job.

Same fail-open pattern.

**Verify**: `pnpm run typecheck` → exit 0

### Step 7: Add read-from-Appwrite on app start

In `src/lib/sync/sync-handlers.ts` or a new `src/lib/sync/pull-handlers.ts`, add:

```typescript
export async function pullRemoteData(userId: string): Promise<void> {
  // 1. Fetch remote competencies from Appwrite
  const remoteCompetencies = await databases.listDocuments(
    DATABASE_ID, COLLECTIONS.COMPETENCIES,
    [Query.equal("userId", userId)]
  );
  // 2. For each remote doc, if it's newer than local, update Dexie
  for (const doc of remoteCompetencies.documents) {
    const local = await deps.db.competencies.get(doc.$id);
    if (!local || new Date(doc.updatedAt) > new Date(local.updatedAt)) {
      await deps.db.competencies.put({ ...doc, id: doc.$id });
    }
  }
  // 3. Repeat for flashcards, retentionRecurrence
}
```

Call this from the app's startup sync flow (likely in `src/lib/sync/` initializer or a useEffect in the root layout).

**Verify**: `pnpm run typecheck` → exit 0

### Step 8: Write integration tests

Create `src/lib/sync/__tests__/cross-device-sync.test.ts`:

- Enqueues competency sync job → handler writes to mock Appwrite
- Enqueues flashcard sync job → handler serializes SM-2 state correctly
- `pullRemoteData()` fetches from mock Appwrite and updates local Dexie
- Last-write-wins conflict resolution — newer timestamp overwrites older
- Fail-open on Appwrite error — local data preserved

Model test structure after existing `src/lib/sync/__tests__/sync-handlers.test.ts`.

**Verify**: `pnpm run test -- cross-device-sync` → all tests pass

## Test plan

- `src/lib/sync/__tests__/cross-device-sync.test.ts` — 6-8 tests covering:
  - Competency sync handler serializes correctly
  - Flashcard sync handler serializes SM-2 state
  - Retention-recurrence sync handler
  - `pullRemoteData` fetches and merges
  - Last-write-wins conflict resolution
  - Fail-open on Appwrite network error

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test -- cross-device-sync` passes all new tests
- [ ] Modifying a competency on one device → enqueues `appwrite-competencies-sync` job
- [ ] Reviewing a flashcard → enqueues `appwrite-flashcard-sync` job
- [ ] `pullRemoteData()` fetches from Appwrite and updates local Dexie with newer records
- [ ] No out-of-scope files modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- If Appwrite `COLLECTIONS` does not contain `competencies`, `flashcards`, or `retentionRecurrence` — document the gap and stop
- If the `enqueue()` function signature has changed since `169d3704` — verify and adapt payload shape
- If `Flahscard` type does not have a `userId` field — investigate and report

## Maintenance notes

- Phase 2 (future): push notifications when sync completes on another device, sync status in settings
- Phase 3 (future): CRDT-based conflict resolution for SM-2 state (easiest approach: keep per-device session IDs, prefer most recent)
- The `pullRemoteData` function should be called on app start and periodically. Consider adding to the existing sync initializer.
- Watch for Appwrite 50k doc limit — competencies and flashcards scale with student activity. Add a cleanup job if needed.
