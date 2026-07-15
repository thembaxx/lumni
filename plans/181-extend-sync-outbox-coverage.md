# Plan 181: Extend Sync Outbox to Cover More Data Types

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/sync/sync-writer.ts src/lib/sync/types.ts src/lib/db/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: plans/164-fix-sync-null-id-outbox.md (fix null id bug first), plans/166-fix-sync-swallowed-errors.md (fix silent errors first)
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The sync outbox currently wires only 12 of 38+ Dexie tables. User data in un-synced tables — study guides, vocabulary lists, pronunciation history, story progress, story questions, dictionary cache — remains device-local. Users switching devices lose this data. Each missing table is a few lines to add since the pattern is established.

## Current state

In `src/lib/sync/sync-writer.ts`, `SYNCABLE_TABLES` lists ~12 tables. Missing tables include:

- `studyGuides` — AI-generated study guides
- `vocabularyList` — saved vocabulary words
- `pronunciationHistory` — pronunciation practice scores
- `storyCache` — downloaded story content
- `storyQuestions` — story comprehension question state
- `dictionaryCache` — cached dictionary lookups

The pattern for adding a table is:

1. Add the table name string to `SYNCABLE_TABLES` array
2. Add the DataAccess accessor to `SYNC_TABLES` map
3. Verify the table has a `lastModified` timestamp or similar conflict-resolution field

## Commands you will need

| Purpose   | Command                                      | Expected on success |
| --------- | -------------------------------------------- | ------------------- |
| Install   | `pnpm install`                               | exit 0              |
| Typecheck | `pnpm run typecheck`                         | exit 0, no errors   |
| Tests     | `pnpm run test -- --run --run src/lib/sync/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                     | exit 0              |

## Scope

**In scope**:

- `src/lib/sync/sync-writer.ts` — add table entries
- `src/lib/sync/types.ts` — verify types include new table names
- `src/lib/sync/service.ts` — verify pull side iterates new tables

**Out of scope**:

- Schema changes or migrations (tables already exist)
- The DataAccess layer itself

## Steps

### Step 1: Verify each target table has a timestamp field

Check `src/lib/db/schema.ts` to ensure each target table has a `updatedAt` or `lastModified` or similar timestamp field needed for LWW conflict resolution. If a table lacks one, note it and skip (report back).

### Step 2: Add tables to `SYNCABLE_TABLES`

In `src/lib/sync/sync-writer.ts`, find the `SYNCABLE_TABLES` array. Add the new table name strings:

```typescript
const SYNCABLE_TABLES = [
  // existing tables...
  "studyGuides",
  "vocabularyList",
  "pronunciationHistory",
  "storyCache",
  "storyQuestions",
] as const;
```

### Step 3: Add DataAccess accessors to `SYNC_TABLES`

In the same file, find the `SYNC_TABLES` map. Add entries for each new table with their DataAccess accessors.

### Step 4: Update pull side if needed

Check `src/lib/sync/service.ts` — the `pullRemote()` method iterates tables. If it has a hardcoded table list rather than reading from `SYNC_TABLES`, update it to use the dynamic list.

**Verify**: `rg "studyGuides" src/lib/sync/` → matches in sync-writer.ts
**Verify**: `rg "vocabularyList" src/lib/sync/` → matches in sync-writer.ts

### Step 5: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/sync/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing sync tests should pass. If there's a test that enumerates syncable tables, update the expected count. Add a test that verifies the new tables appear in the outbox after data is written.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Study guides, vocabulary, pronunciation history, and story tables are in `SYNCABLE_TABLES`
- [ ] Corresponding DataAccess accessors are in `SYNC_TABLES`
- [ ] Pull side recognizes the new tables
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any target table lacks a timestamp field for conflict resolution — report which ones and we'll address per-table
- The sync pull side has a fundamentally different structure than expected
- Adding tables breaks existing sync tests

## Maintenance notes

Tables added to the sync outbox should be reviewed for conflict-resolution strategy. Currently LWW (last-writer-wins) is used. Tables with merge semantics (e.g., `pronunciationHistory` should append, not overwrite) may need special handling in a future Phase C.
