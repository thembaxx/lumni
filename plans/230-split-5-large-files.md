# Plan 230: Split 6 large files exceeding single-responsibility boundaries

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: tech-debt / maintainability
- **Generated at**: 2026-07-17

## Why this matters

Six files exceed 400 lines each and violate single-responsibility boundaries. Large files are harder to review, test, and navigate. Each contains multiple unrelated concerns that should be separate modules. Splitting them improves maintainability, reduces merge conflicts, and makes the codebase more approachable for new contributors.

## Current state

| File                                            | Lines | Concerns mixed                                                                                                               |
| ----------------------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/db/schema.ts`                          | 831   | Schema definitions + TypeScript type exports                                                                                 |
| `src/lib/question-engine/language-validator.ts` | 575   | Validation logic + quality scoring + schema checks + language config                                                         |
| `src/lib/study-planner/adaptive-planner.ts`     | 479   | Scheduling algorithm + weighting logic + constants + Dexie queries                                                           |
| `src/lib/analytics/risk-model.ts`               | 433   | Risk calculation + data fetching + multiple model implementations                                                            |
| `src/lib/db/ensure-schema.ts`                   | 433   | Table creation + index management + migration logic                                                                          |
| `src/components/quiz/bolt-quiz.tsx`             | 293   | Note: qualifies on complexity grounds — component logic + quiz result processor wiring + gamification wiring + feature flags |

## Target state

Each file split into 2-3 focused files with clear single responsibilities:

- `schema.ts` → `schema.ts` (table defs) + `types.ts` (shared types)
- `language-validator.ts` → `language-validator.ts` (validation) + `quality-scorer.ts` (scoring) + `schema-validator.ts` (schema checks)
- `adaptive-planner.ts` → `adaptive-planner.ts` (orchestration) + `schedule-optimizer.ts` (algorithm) + `constants.ts` (config)
- `risk-model.ts` → `risk-model.ts` (model interface) + `risk-calculator.ts` (calculation) + `risk-data.ts` (fetching)
- `ensure-schema.ts` → `schema-creator.ts` (creation) + `migration-runner.ts` (migrations)

## Scope

- 5 source files to split into 11-15 files total
- Backward-compatible barrels at original file locations (re-export from new location)
- All imports updated across the codebase
- Do NOT change any public API or function signatures

## Steps

### 1. Split `src/lib/db/schema.ts`

- Move all type-only exports (interfaces for `WrongAnswerEntry`, `NoteRecord`, etc.) to `src/lib/db/types.ts`
- Keep Dexie table definitions and metadata in `schema.ts`
- Create barrel: `schema.ts` re-exports from `types.ts`
- Update `data-access.ts` to import from `types.ts` where needed

### 2. Split `src/lib/question-engine/language-validator.ts`

- Extract `QualityScorer` class and scoring logic → `src/lib/question-engine/quality-scorer.ts`
- Extract schema validation functions → `src/lib/question-engine/schema-validator.ts`
- Keep `LanguageQualityValidator` class with validation orchestration in `language-validator.ts`
- Each new file re-exports its main class/function; `language-validator.ts` imports from both

### 3. Split `src/lib/study-planner/adaptive-planner.ts`

- Extract schedule weights, defaults, constants → `src/lib/study-planner/planner-constants.ts`
- Extract optimization algorithm → `src/lib/study-planner/schedule-optimizer.ts`
- Keep the main `AdaptivePlanner` class orchestrating the flow

### 4. Split `src/lib/analytics/risk-model.ts`

- Extract `RiskCalculator` and model implementations → `src/lib/analytics/risk-calculator.ts`
- Extract data-fetching functions → `src/lib/analytics/risk-data.ts`
- Keep risk model interface and `RiskModelService` orchestration in `risk-model.ts`

### 5. Split `src/lib/db/ensure-schema.ts`

- Extract table creation logic → `src/lib/db/schema-creator.ts`
- Extract index management → `src/lib/db/index-manager.ts`
- Keep migration orchestration in `ensure-schema.ts` (rename to `migration-runner.ts` if cleaner)

### 6. Verify everything works

- `pnpm run typecheck` — 0 errors
- `pnpm run test` — no regressions
- `pnpm exec oxlint` — 0 warnings

Verification: `pnpm run typecheck ; pnpm run test`

## Stop conditions

- Any extracted module creates a circular import — merge it back or redesign the boundary
- The barrel re-export at the original path changes a public function's import behavior — stop and fix the barrel

## Estimated time

5-7 hours
