# Plan 171: Fix `as any` Cast in Sync Pull Route

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/sync/service.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

`record.id` is typed as `string` (from the API response), but the Dexie table accessor expects `string | number`. The `as any` suppresses the mismatch. If a future migration introduces numeric IDs (e.g., auto-increment for a new table), the `get()` returns `undefined`, the local freshness check fails, and the remote record overwrites local even when local is newer.

## Current state

In `src/lib/sync/service.ts`, line ~141:

```typescript
const local = await accessor.get(record.id as any);
```

The `as any` hides a genuine type mismatch between API response types and Dexie primary key types.

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

## Steps

### Step 1: Replace `as any` with a runtime guard

Replace:

```typescript
const local = await accessor.get(record.id as any);
```

with:

```typescript
const id =
  typeof record.id === "number" || typeof record.id === "string" ? record.id : String(record.id);
const local = await accessor.get(id);
```

This preserves type safety while handling both string and number IDs. If `record.id` is neither, it's coerced to string as a fallback.

**Verify**: `rg "as any\)" src/lib/sync/service.ts` → 0 matches in the pull path

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/sync/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests should pass. The guard handles the same types as before. No new tests needed for this type safety improvement.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/sync/` exits 0
- [ ] No `as any` in `src/lib/sync/service.ts` for the `accessor.get()` call
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The `as any` line is no longer at line ~141 (may have moved)
- The `accessor` type is different from expected
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

If Dexie ever supports composite or complex primary keys, this guard may need revisiting. For now, all IDs are either `string` or `number`. Reviewers should verify no other `as any` casts exist in the sync pull path.
