# Plan 011: Optimize sync handler memory with streaming

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/sync/sync-handler.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

`flushOfflineData` loads 8 Dexie tables into memory simultaneously via `Promise.all([...toArray()])`, then enqueues individual sync jobs per record. A student with 500 flashcards, 200 quiz attempts, and 1000 wrong answers materializes ~1800+ objects at once, then enqueues thousands of individual Appwrite sync jobs. This causes GC pressure and could trigger OOM on low-end mobile devices.

## Current state

**`src/lib/sync/sync-handler.ts:9-28`**:
```typescript
export async function flushOfflineData(userId: string): Promise<void> {
  const [
    allProgress, allAttempts, allCompetencies,
    allFlashcards, allWrongAnswers, allChatMessages,
    allRatings, allBookmarks,
  ] = await Promise.all([
    _deps.db.progress.toArray(),
    _deps.db.quizAttempts.toArray(),
    _deps.db.competencies.toArray(),
    _deps.db.flashcards.toArray(),
    _deps.db.wrongAnswers.toArray(),
    _deps.db.chatMessages.toArray(),
    _deps.db.questionRatings.toArray(),
    _deps.db.bookmarks.toArray(),
  ]);
  // Then flatMap each array into enqueue() calls...
}
```

All 8 tables are loaded simultaneously. Each table's records are then enqueued individually.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check src/lib/sync/sync-handler.ts` | 0 errors |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/lib/sync/sync-handler.ts`

**Out of scope**:
- `src/lib/orchestrator/job-queue.ts` — do not change enqueue semantics
- Appwrite sync endpoints

## Git workflow

- Branch: `advisor/011-sync-handler-memory`
- Commit: `perf: stream sync handler tables sequentially to reduce memory`

## Steps

### Step 1: Process tables sequentially with batching

Replace the parallel `toArray()` with sequential processing. Process one table at a time, enqueueing in batches:

```typescript
export async function flushOfflineData(userId: string): Promise<void> {
  const TABLES = [
    { name: "progress", toArray: () => _deps.db.progress.toArray() },
    { name: "quizAttempts", toArray: () => _deps.db.quizAttempts.toArray() },
    { name: "competencies", toArray: () => _deps.db.competencies.toArray() },
    { name: "flashcards", toArray: () => _deps.db.flashcards.toArray() },
    { name: "wrongAnswers", toArray: () => _deps.db.wrongAnswers.toArray() },
    { name: "chatMessages", toArray: () => _deps.db.chatMessages.toArray() },
    { name: "questionRatings", toArray: () => _deps.db.questionRatings.toArray() },
    { name: "bookmarks", toArray: () => _deps.db.bookmarks.toArray() },
  ];

  for (const table of TABLES) {
    try {
      const records = await table.toArray();
      // Enqueue in batches of 50
      for (let i = 0; i < records.length; i += 50) {
        const batch = records.slice(i, i + 50);
        // Enqueue the batch — the exact enqueue logic depends on table type
        // Keep the existing flatMap logic per table, just batch the enqueue calls
        await enqueueBatch(table.name, batch, userId);
      }
    } catch (e) {
      logError(`SyncHandler.${table.name}`, e);
    }
  }
}
```

The exact implementation of `enqueueBatch` depends on the per-table enqueue logic currently in the `flatMap`. Read the full file (lines 30-133) to understand the per-table transformation and preserve it.

**Verify**: `npx biome check src/lib/sync/sync-handler.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/sync/sync-handler.ts
bun run test
```

## Test plan

- Add a test in `src/lib/sync/__tests__/sync-handler.test.ts`:
  - Seed InMemoryDataAccess with records across all 8 tables
  - Call `flushOfflineData(userId)`
  - Verify enqueue was called with correct records
  - Verify no table is loaded simultaneously (check that only one table's records are in memory at a time)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/sync/sync-handler.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "Promise.all" src/lib/sync/sync-handler.ts` returns no matches in `flushOfflineData`
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The per-table enqueue logic is too complex to batch (unlikely — it's simple flatMap).
- The `enqueue` function doesn't support batching (it accepts individual jobs — that's fine, we still batch the `toArray()` calls).

## Maintenance notes

- If a 9th table is added to the sync handler, add it to the `TABLES` array.
- The batch size of 50 is arbitrary — IndexedDB transactions can handle larger batches, but 50 keeps memory usage bounded.
- The existing sync semantics (all records from a table are enqueued) are preserved.
