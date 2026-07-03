# Plan P006: Replace `as any` Type Escape on Sync Outbox Table

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/lib/sync/outbox.ts src/lib/sync/service.ts`
> If either file changed, compare the "Current state" excerpts against the live code.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

`outbox.ts:6` uses `return offlineDB.table("syncOutbox") as any;` which silences all TypeScript checking on every Dexie operation (`.add()`, `.orderBy()`, `.bulkDelete()`, `.get()`, `.update()`). A schema version change that renames a field, changes a column type, or removes a column compiles silently and crashes at runtime. The `DataAccess` seam already has a typed `TaggedTable<SyncOutboxEntry, number>` accessor that should be used instead.

## Current state

**`src/lib/sync/outbox.ts:3-7`**:

```typescript
async function getTable() {
  const { offlineDB } = await import("@/lib/db/schema");
  // oxlint-disable-next-line typescript/no-explicit-any
  return offlineDB.table("syncOutbox") as any;
}
```

The `DataAccess` interface (`src/lib/db/data-access.ts`) already has `syncOutbox: DataAccessTable<SyncOutboxEntry, number>` as part of the `SyncDataAccess` sub-interface. Both `DexieDataAccess` and `InMemoryDataAccess` implement it.

However, `outbox.ts` is a module of standalone functions, not a class with DI. Using `DataAccess` here requires either:

1. Making the functions accept `DataAccess` as a parameter (preferred)
2. Directly using the typed `DexieDataAccess` table accessor

This plan uses approach (1) for clean design: thread `DataAccess` through `outbox.ts` functions via a `_deps`-style parameter, or add a `db` parameter to each function.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/lib/sync/outbox.ts` — replace `as any` with typed access
- `src/lib/sync/service.ts` — pass `DataAccess` to outbox functions (or update call sites)
- `src/lib/sync/types.ts` — no changes expected, but verify types

**Out of scope**:

- Any other `as any` casts elsewhere in the codebase
- Adding test files for outbox.ts (already has `outbox.test.ts`)
- The `sync-manager.ts` or sync route handlers

## Git workflow

- Branch: `advisor/P006-outbox-any`
- Commit message: `fix: replace as any cast in sync outbox with typed DataAccess accessor`
- Do NOT push or open a PR

## Steps

### Step 1: Add a `db` parameter to exported functions

`outbox.ts` exports: `enqueueOutbox`, `getPendingOutboxEntries`, `incrementRetry`, `removeOutboxEntries`, (and possibly `getPendingCount` if it exists).

Add a `db: SyncDataAccess` parameter to each exported function. If adding a parameter to all functions is too invasive, create a `_deps`-style pattern:

```typescript
import type { SyncDataAccess } from "@/lib/db";

let _db: SyncDataAccess | null = null;
export function __setDbForTesting(db: SyncDataAccess) {
  _db = db;
}

async function getTable(): Promise<DataAccessTable<SyncOutboxEntry, number>> {
  if (_db) return _db.syncOutbox;
  const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
  return dexieDataAccess.syncOutbox;
}
```

Alternatively, the cleaner approach: thread `db` through each function. Since `service.ts` is the only consumer, this is low-impact.

Change signatures:

```typescript
export async function enqueueOutbox(
  table: string,
  recordId: string,
  operation: "create" | "update" | "delete",
  data: unknown,
  db?: SyncDataAccess,
): Promise<void>;
```

### Step 2: Replace `getTable()` body

Replace the body of `getTable()`:

```typescript
async function getTable(): Promise<DataAccessTable<SyncOutboxEntry, number>> {
  if (_db) return _db.syncOutbox;
  const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
  return dexieDataAccess.syncOutbox;
}
```

Remove the `// oxlint-disable-next-line` comment — it's no longer needed.

### Step 3: Update service.ts if needed

If `service.ts` imports from `outbox`, check that the calls still compile. If the functions now accept an optional `DataAccess` parameter, no changes are needed in `service.ts` — the dynamic import handles the non-DI path.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint` → exit 0.

## Test plan

No new tests needed. The existing `outbox.test.ts` should still pass. Run `pnpm run test -- outbox` to verify.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -n "as any" src/lib/sync/outbox.ts` returns no matches
- [ ] `grep -n "oxlint-disable.*no-explicit-any" src/lib/sync/outbox.ts` returns no matches (the disable comment is removed)
- [ ] No files outside in-scope list are modified
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- `SyncDataAccess` doesn't have a `syncOutbox` field — check `src/lib/db/data-access.ts` for the sub-interface
- The dynamic import path `@/lib/db/dexie-data-access` doesn't resolve — verify the barrel export exists
- The existing `outbox.test.ts` has `as any` assumptions that break

## Maintenance notes

- If future code adds a new function to `outbox.ts`, it should follow the same pattern (accept optional `DataAccess` or use the `_db` fallback)
- The dual-path pattern (`_db` for tests, dynamic import for production) matches the codebase's DI conventions
