# Plan 137: Fix matric results — replace fake data with real disclaimer

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/lib/matric-results/ src/app/api/matric-results/`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`src/lib/matric-results/data.ts` contains 793 lines of hardcoded fake student names with seeded random scores. `searchMatricResults()` in `src/lib/matric-results/index.ts` powers the public API at `/api/matric-results`. Students searching for real classmates get fabricated data. For an education platform, data integrity is table stakes — this is a trust/legal liability.

## Current state

- `src/lib/matric-results/data.ts:793` — hardcoded names + `seedrandom`-based score generation
- `src/lib/matric-results/index.ts` — `searchMatricResults()` that queries the fake data and matches by name substring
- `src/app/api/matric-results/route.ts` — public API endpoint returning these fake results

## Steps

### Step 1: Add clear disclaimer to the search UI

Edit the `src/app/api/matric-results/route.ts` response to include `isDemoData: true` and a `disclaimer` field.

### Step 2: Add prominent disclaimer badge to the results component

Find the component that renders matric results (likely in `src/components/`). Add a visible warning badge: "Demo data — not real matric results. Official DBE results pending integration."

### Step 3: Add TODO documenting DBE integration path

Add a TODO comment in `src/lib/matric-results/index.ts` documenting:

- DBE publishes results via https://www.education.gov.za/
- Integration path: scrape or partner API
- Affected files: data.ts, index.ts, route.ts

## Done criteria

- [ ] API response includes `isDemoData: true` and `disclaimer` field
- [ ] UI shows visible demo-data disclaimer
- [ ] TODO documents the real DBE integration path
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
