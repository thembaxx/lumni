# Plan 136: Fix unbounded Dexie toArray() in digest + analytics

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/lib/digest/ src/lib/analytics/`

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`DigestService.computeWeeklyStats()` calls `this.deps.db.quizAttempts.toArray()` then filters in JS — loads the ENTIRE quizAttempts table into memory. For a user with thousands of quiz attempts (common over months of use), this causes OOM/timeout on the server-side weekly digest. Similarly, analytics services use unbounded loads.

## Current state

`src/lib/digest/digest-service.ts:34`:

```ts
const attempts = (await this.deps.db.quizAttempts.toArray()).filter(
  (a) => a.completedAt >= sevenDaysAgo,
);
```

All records loaded, then filtered. Should use Dexie `.where()` for indexed filtering.

## Steps

### Step 1: Fix DigestService to use indexed query

Replace the `toArray().filter()` with Dexie's `where()`:

```ts
const attempts = await this.deps.db.quizAttempts
  .where("completedAt")
  .aboveOrEqual(sevenDaysAgo)
  .toArray();
```

This requires a `completedAt` index. Check `src/lib/db/schema.ts` for the `quizAttempts` table index definition. If `completedAt` is not indexed, add it to the schema string for the `quizAttempts` table.

**Verify**: `pnpm run typecheck` → 0 errors

### Step 2: Check analytics-service.ts for similar patterns

Check `src/lib/analytics/analytics-service.ts` for `toArray()` + `filter()` patterns. Apply the same `where()` fix. Common patterns:

- `this.deps.db.progress.toArray()`
- `this.deps.db.quizAttempts.toArray()`
- Any table with a date/timestamp field that could be indexed

### Step 3: Add index to schema if needed

If `completedAt` is not already indexed in `src/lib/db/schema.ts`, add it. Look for the `quizAttempts` table string and append `&completedAt` or `completedAt` (depending on whether it should be a primary key or index).

After changing schema, run migration test.

**Verify**: `pnpm run test -- schema` → all pass

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No `toArray()` calls in `digest-service.ts` that load the full table before filtering
- [ ] All date-range queries use `where().aboveOrEqual()` or equivalent indexed query

## STOP conditions

Stop and report if:

- The Dexie schema for `quizAttempts` doesn't support adding a `completedAt` index without a migration version bump
- The analytics service has complex queries that can't be easily converted
