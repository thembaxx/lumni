---
status: TODO
priority: P2
effort: M
risk: MED
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 175 — Dual study-planner state (legacy `utils` + `StudyPlannerService`)

## Context

Session 38 wrapped study-plan logic in `StudyPlannerService` but did not replace the legacy `src/lib/utils/study-planner.ts`, which still holds a mutable `_deps` singleton and the canonical plan/state plus `./storage` localStorage. Two owners of canonical state share one mutable `_deps`/localStorage. Call sites are split: legacy functions used directly in `gamification-wiring.ts`, `study-plan-overview.tsx`, `use-dashboard-quiz.ts`; the service used in `use-study-planner.ts`. This risks divergence and harder testing.

## Current state (verified)

`src/lib/utils/study-planner.ts:1-10` — imports `dexieDataAccess`, defines mutable `_deps` singleton (legacy store).
`src/lib/services/study-planner-service.ts:4` — imports `ExamDateInfo` from `@/lib/utils/study-planner` (layered on top).
Call sites: `src/app/[locale]/exam/[id]/exam-session/gamification-wiring.ts:12`, `src/components/dashboard/study-plan-overview.tsx:16`, `src/hooks/use-dashboard-quiz.ts:15` (legacy); `src/hooks/use-study-planner.ts:5` (service).

## Goal

Make `StudyPlannerService` the single canonical owner; have legacy `utils/study-planner.ts` re-export/forward to it (or migrate call sites) so there is one state source.

## Steps

1. Read `src/lib/utils/study-planner.ts` and `src/lib/services/study-planner-service.ts` fully; list every exported symbol from the legacy module and its callers (grep each export name).
2. For each legacy export:
   - If it is pure data/types (`ExamDateInfo`, `StudyPlan`, `StudySession`, types), move/keep the type in the service module or a shared `types.ts` and re-export from legacy for backward-compat (no behavior change).
   - If it is stateful (`addStudySession`, `markPlanStale`, plan persistence), re-implement it as a thin forwarder to `StudyPlannerService` (or `dexieDataAccess`) so the service owns the data.
3. Update the three legacy call sites (`gamification-wiring.ts`, `study-plan-overview.tsx`, `use-dashboard-quiz.ts`) to import from the service module where possible, keeping legacy re-exports until all call sites migrate.
4. Remove the mutable `_deps` singleton from `utils/study-planner.ts` once no caller uses it (verify with grep + `pnpm exec knip --no-exit-code`).
5. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/utils/study-planner.ts`, `src/lib/services/study-planner-service.ts`, the 3 legacy call sites.
- Out of scope: `use-study-planner.ts` (already on the service), the planning algorithm.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/study-planner src/lib/services/study-planner-service src/hooks/use-study-planner` → pass.
- `pnpm exec knip --no-exit-code` → no new unused-export noise for these modules.

## Test plan

- Extend `src/lib/study-planner/__tests__/*`: assert that calling the legacy `addStudySession`/`markPlanStale` writes to the same Dexie store the service reads (single source of truth). Mirror existing planner test setup.

## Maintenance

- Future study-plan features go through `StudyPlannerService` only.

## Escape hatches

- If the legacy module's functions are deeply intertwined with `./storage` localStorage that the service does not yet cover, first port that storage into the service (small) before removing the legacy path. Do not leave two writers.
