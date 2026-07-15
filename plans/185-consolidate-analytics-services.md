# Plan 185: Consolidate Analytics Services (3 Classes → 1)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/services/analytics-service.ts src/lib/analytics/analytics-service.ts src/lib/admin/analytics-service.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Three separate `AnalyticsService` classes exist with overlapping concerns:

- `src/lib/services/analytics-service.ts` — client-side tracking + API calls
- `src/lib/analytics/analytics-service.ts` — server-side Appwrite queries for trends/comparative
- `src/lib/admin/analytics-service.ts` — admin platform-wide stats

Both server-side classes (`analytics/` and `admin/`) duplicate Appwrite query patterns. Adding a new metric requires changing 2-3 files. Consumers must know which one to import.

## Steps

### Step 1: Merge server-side analytics into `src/lib/analytics/`

Move the `AnalyticsService` from `src/lib/analytics/analytics-service.ts` to own the server-side data layer. Move admin `PlatformAnalyticsService` methods into the same class as static methods (or as a separate export from the same module). The key is: one import path for all analytics data queries.

### Step 2: Update the client-side service to delegate

`src/lib/services/analytics-service.ts` should continue to handle client-side tracking (sending events to Dexie/API) but delegate server-side data queries to `src/lib/analytics/`.

### Step 3: Update the barrel at `src/lib/services/index.ts`

Export the client-side tracking service from `@/lib/services` but not the server-side query class (API routes should import directly from `@/lib/analytics`).

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0
