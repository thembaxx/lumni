# Plan 183: Consolidate Competing Bookmark Sync Mechanisms

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/bookmark-service/ src/lib/sync/sync-writer.ts src/lib/orchestrator/handlers/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Bookmark mutations flow through TWO independent sync mechanisms with no coordination. `DexieBookmarkService` calls `enqueue("appwrite-bookmark-sync", ...)` (orchestrator job queue for Appwrite write). Simultaneously, `sync-writer.ts` wraps the Dexie bookmarks table's `put/add/delete` with `enqueueOutbox(...)` calls (sync layer outbox). Both write to Appwrite but with different entry formats and no dedup. Bookmarks can be written twice, dropped, or conflict. This is a real data integrity risk.

## Current state

- `src/lib/bookmark-service/service.ts:15` — `enqueue("appwrite-bookmark-sync", ...)` via orchestrator
- `src/lib/sync/sync-writer.ts:13` — `bookmarks` listed as syncable table, `initSyncWriters` wraps Dexie operations with `enqueueOutbox(...)`
- `src/lib/orchestrator/handlers/sync-handlers.ts:302` — `appwrite-bookmark-sync` handler

The sync outbox (`src/lib/sync/`) is the newer, more general approach. The orchestrator-based `appwrite-bookmark-sync` handler is the older, duplicative path.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/bookmark-service/service.ts` — remove the `enqueue()` call
- `src/lib/bookmark-service/dexie-bookmark-service.ts` — ensure it uses `initSyncWriters` properly
- `src/lib/orchestrator/handlers/sync-handlers.ts` — remove the `appwrite-bookmark-sync` handler

**Out of scope**:

- Other sync handlers in the orchestrator
- The sync layer outbox mechanism (it's correct)

## Steps

### Step 1: Remove the `enqueue()` call from bookmark service

In `src/lib/bookmark-service/service.ts`, find the line that calls `enqueue("appwrite-bookmark-sync", ...)`. Remove it. The sync layer's `initSyncWriters` already enqueues outbox entries for the bookmarks table automatically.

### Step 2: Verify sync writer wraps bookmark operations

Check `src/lib/sync/sync-writer.ts` to confirm `bookmarks` is in `SYNCABLE_TABLES` and its DataAccess accessor is in `SYNC_TABLES`. If the `wrapTableForSync("bookmarks")` call exists, the sync outbox path is active. If not, add it.

### Step 3: Remove dead `appwrite-bookmark-sync` handler

In `src/lib/orchestrator/handlers/sync-handlers.ts`, remove the `appwrite-bookmark-sync` case handler and its associated code (function and registration). Verify no other code references this handler key.

**Verify**: `rg "appwrite-bookmark-sync" src/` → 0 matches after removal

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Update any tests that mock or assert the `appwrite-bookmark-sync` handler behavior. They should be removed or updated to verify the sync outbox path instead. Existing bookmark service tests should pass (behavior is unchanged — only the underlying sync mechanism changes).

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `enqueue("appwrite-bookmark-sync", ...)` removed from bookmark service
- [ ] `appwrite-bookmark-sync` handler removed from orchestrator
- [ ] Sync writer wraps bookmark table operations
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `enqueue()` call in the bookmark service is structured differently
- The sync writer doesn't currently wrap bookmark operations — in that case, add it in step 2
- Removing the orchestrator handler breaks tests that depend on it

## Maintenance notes

After this consolidation, ALL data persistence flows through the sync layer outbox. The orchestrator-based sync handlers are legacy and should be deprecated for remaining tables in a future Phase C cleanup. Reviewers should verify no other tables have dual sync paths.
