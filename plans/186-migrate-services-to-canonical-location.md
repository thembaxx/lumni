# Plan 186: Migrate Services to Canonical Location

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/services/ src/lib/bookmark-service/ src/lib/digest/ src/lib/utils/tts-service.ts src/lib/utils/gamification.ts src/lib/utils/engine-analytics.ts`
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

Service code lives in 5+ top-level directories instead of the canonical `src/lib/services/`. The barrel at `src/lib/services/index.ts` is misleading — it doesn't represent all services. New contributors can't predict where to find or add a service. Services scattered in `src/lib/utils/`, `src/lib/bookmark-service/`, `src/lib/digest/`, `src/lib/admin/`, and `src/lib/analytics/` all need different import paths.

## Current state

Services outside `src/lib/services/`:

- `src/lib/bookmark-service/` — `DexieBookmarkService`
- `src/lib/digest/` — `DigestService`
- `src/lib/utils/tts-service.ts` — `TTSService`
- `src/lib/utils/gamification.ts` — pure constants (rarity colors, borders)
- `src/lib/utils/engine-analytics.ts` — event tracking
- `src/lib/admin/` — `ExamDownloadService`, `ExamUploadService`, `PlatformAnalyticsService`

The `src/lib/services/index.ts` barrel exports ~15 symbols but is missing all of the above.

## Steps

### Step 1: Move `DexieBookmarkService` into `src/lib/services/bookmark-service.ts`

Move or create barrel re-export from `src/lib/bookmark-service/` into `src/lib/services/`. Update all import references.

### Step 2: Move `DigestService` into `src/lib/services/digest-service.ts`

Move or re-export.

### Step 3: Move `TTSService` from `src/lib/utils/` to `src/lib/services/tts-service.ts`

This is a proper service class (140 lines, listeners, mutations). It doesn't belong in `utils/`.

### Step 4: Move pure gamification constants into `src/lib/gamification-engine/`

`src/lib/utils/gamification.ts` contains rarity colors/borders — purely presentational constants that belong with the gamification engine, not utils.

### Step 5: Move `engine-analytics.ts` into `src/lib/services/analytics-service.ts`

Merge event tracking into the existing client-side analytics service.

### Step 6: Update barrel at `src/lib/services/index.ts`

Export all migrated services so there's a single import path: `@/lib/services`.

### Step 7: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0
