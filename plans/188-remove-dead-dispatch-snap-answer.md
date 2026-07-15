# Plan 188: Remove Dead `dispatchSnapAnswer` Export

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/shared/snap-answer.ts src/lib/services/solve-pipeline.ts src/lib/services/index.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

`dispatchSnapAnswer()` is exported from `src/lib/shared/snap-answer.ts` and re-exported through `solve-pipeline.ts` and the services barrel, but zero consumers import it. It's orphaned dead code — tree-shaken from bundles but confusing to anyone reading the exports.

## Steps

### Step 1: Remove `dispatchSnapAnswer` export from `snap-answer.ts`

In `src/lib/shared/snap-answer.ts`, remove the `export` keyword from the function (or delete the file entirely if there's nothing else in it).

### Step 2: Remove re-export from `solve-pipeline.ts`

Find and remove the re-export of `dispatchSnapAnswer` from `src/lib/services/solve-pipeline.ts:56`.

### Step 3: Remove from barrel in `src/lib/services/index.ts`

Remove the re-export from the services barrel.

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0
