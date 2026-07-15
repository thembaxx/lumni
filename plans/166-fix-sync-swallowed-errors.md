# Plan 166: Fix Silent `.catch(() => {})` on Sync Outbox Writes

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/sync/sync-writer.ts src/components/sync/conflict-resolver.tsx`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Every wrapped `put`/`add`/`delete` on syncable tables does `.catch(() => {})`. An outbox-enqueue failure means the change is written to Dexie but never replicated to the server. The `ConflictResolver` component also swallows load errors — the component stays empty and the user sees "0 conflicts" even when the outbox is stuck. All 12 syncable tables are impacted: flashcards, notes, bookmarks, competencies, quiz sessions, etc.

## Current state

In `src/lib/sync/sync-writer.ts`, lines ~37, 44, 50:

```typescript
enqueueOutbox(entry).catch(() => {}); // error silently swallowed
```

In `src/components/sync/conflict-resolver.tsx`, line ~35:

```typescript
loadConflicts().catch(() => {}); // empty state even when stuck
```

These are likely intentional fail-open (don't let sync failure block the main write) but need observability.

The repo convention for error logging: use `logError("context", error, extra?)` from `@/lib/shared/logger` — see `src/lib/services/retention-service.ts` for examples.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/sync/sync-writer.ts`
- `src/components/sync/conflict-resolver.tsx`

**Out of scope**:

- Any other `.catch(() => {})` instances outside sync

## Steps

### Step 1: Replace `.catch(() => {})` with `logError` in `sync-writer.ts`

In `src/lib/sync/sync-writer.ts`, import `logError` from `@/lib/shared/logger` (add at top of file). Replace each `.catch(() => {})` with:

```typescript
.catch((e) => logError("SyncWriter.enqueueOutbox", e, { table: entry.table, operation: entry.operation }))
```

There are 3 occurrences (~lines 37, 44, 50). Replace all.

**Verify**: `rg "catch\(\(\) => \{\}\)" src/lib/sync/sync-writer.ts` → 0 matches

### Step 2: Replace `.catch(() => {})` with `logError` in `conflict-resolver.tsx`

In `src/components/sync/conflict-resolver.tsx`, import `logError` from `@/lib/shared/logger`. Replace:

```typescript
loadConflicts().catch(() => {});
```

with:

```typescript
loadConflicts().catch((e) => {
  logError("ConflictResolver.loadConflicts", e);
  // Set an error state so the component shows something
  setError("Failed to load conflicts. Please try again.");
});
```

**Verify**: `rg "catch\(\(\) => \{\}\)" src/components/sync/conflict-resolver.tsx` → 0 matches

### Step 3: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests should pass unchanged — error logging changes don't affect behavior. No new tests needed for the logging change.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Zero `.catch(() => {})` in `src/lib/sync/sync-writer.ts`
- [ ] Zero `.catch(() => {})` in `src/components/sync/conflict-resolver.tsx`
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations doesn't match the excerpts
- `logError` import doesn't exist at `@/lib/shared/logger` (check path)
- Error state variable (`setError`) doesn't exist in `conflict-resolver.tsx` — use whatever state mechanism the component already uses

## Maintenance notes

This is a "never fail silently" pattern that should be enforced codebase-wide. Future sync-related `.catch()` calls should always include `logError`. The `fail-open` pattern is correct (don't break the write because sync failed), but silence is wrong.
