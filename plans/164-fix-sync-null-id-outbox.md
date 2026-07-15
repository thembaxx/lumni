# Plan 164: Fix `entry.id!` Non-Null Assertion on Sync Outbox Rows

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/sync/service.ts src/lib/sync/outbox.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

`getPendingOutboxEntries(50)` returns entries where `id` is typed as `number | undefined` (Dexie auto-increment primary key before `put()` resolves). The code uses `entry.id!` at two callsites. If `entry.id` is `undefined` (e.g., Dexie write collision or unassigned auto-increment), the `!` assertion silently passes `undefined` to `removeOutboxEntries` and `incrementRetry`. The stuck entry never gets cleaned up, blocking the entire sync outbox queue (single FIFO queue). User data across all 12 syncable tables stops syncing.

## Current state

In `src/lib/sync/service.ts`, lines ~58-65:

```typescript
// Push succeeded
pushed.push(entry.id!); // line 60 — entry.id could be undefined
// ...
await incrementRetry(entry.id!); // line 63 — in PushFailed branch
```

The `entry.id` comes from Dexie auto-increment primary key. Before `put()` resolves, `id` is `undefined`. In normal flow this is fine, but if a write collides or the Promise chain breaks, `entry.id` can remain `undefined`.

The `src/lib/shared/logger.ts` pattern for logging: use `logError("context", error)` — see `src/lib/services/retention-service.ts` for usage examples.

## Commands you will need

| Purpose   | Command                                | Expected on success |
| --------- | -------------------------------------- | ------------------- |
| Install   | `pnpm install`                         | exit 0              |
| Typecheck | `pnpm run typecheck`                   | exit 0, no errors   |
| Tests     | `pnpm run test -- --run src/lib/sync/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`               | exit 0              |

## Scope

**In scope**:

- `src/lib/sync/service.ts`

**Out of scope**:

- `src/lib/sync/outbox.ts` — only the service calls it
- Other sync modules

## Steps

### Step 1: Add null guard before `pushed.push(entry.id!)`

In `src/lib/sync/service.ts`, around line 60, find:

```typescript
pushed.push(entry.id!);
```

Replace the `entry.id!` with a guard:

```typescript
if (entry.id == null) {
  logError("SyncService.pushOutbox", new Error("Outbox entry missing id"), { entry });
  continue;
}
pushed.push(entry.id);
```

Import `logError` from `@/lib/shared/logger` if not already imported.

### Step 2: Add null guard before `incrementRetry(entry.id!)`

In `src/lib/sync/service.ts`, around line 63, find the `PushFailed` branch. Replace `entry.id!` with the same guard pattern:

```typescript
if (entry.id == null) {
  logError("SyncService.pushOutbox", new Error("Outbox entry missing id on retry"), { entry });
  continue;
}
await incrementRetry(entry.id);
```

**Verify**: `rg "entry\.id!" src/lib/sync/service.ts` → no matches

### Step 3: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/sync/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

No new tests needed. The existing sync tests cover normal push flow. The guard only activates on undefined IDs (rare edge case). Add a test for undefined ID if there's a test for `pushOutbox` failure — verify the entry is skipped with a log rather than throwing.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/sync/` exits 0
- [ ] Zero `entry.id!` assertions remain in `src/lib/sync/service.ts`
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The code at the locations in "Current state" doesn't match the excerpts
- `logError` is not available at `@/lib/shared/logger`
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

This is guard code — unlikely to be hit in normal operation. Reviewers should verify the `continue` correctly skips the entry without corrupting the loop. The `pushed` array is only used for `removeOutboxEntries` after the loop, so skipping is safe.
