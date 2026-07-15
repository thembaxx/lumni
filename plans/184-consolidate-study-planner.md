# Plan 184: Consolidate Study Planner (5 Files → 1 Module)

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/utils/study-planner.ts src/lib/services/plan-persistence.ts src/lib/services/study-planner-service.ts src/lib/study-planner/ src/lib/db/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: L
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Study planning logic is scattered across 5 files with copy-pasted types and functions. `src/lib/utils/study-planner.ts` (304L) and `src/lib/services/plan-persistence.ts` (314L) are near-identical — same types, same functions, same logic. `src/lib/services/study-planner-service.ts` (336L) dynamically imports `@/lib/study-planner/` creating a fragile circular-ish dependency. Types `StudySession`, `ExamDate`, `StudyPlan` are defined identically in 2+ files. A bug fix must be applied to 2-3 files to be complete.

## Current state

| File                                             | Lines | Role                                                                    |
| ------------------------------------------------ | ----- | ----------------------------------------------------------------------- |
| `src/lib/utils/study-planner.ts`                 | 304   | localStorage persistence + types (legacy, still imported by components) |
| `src/lib/services/plan-persistence.ts`           | 314   | Dexie persistence + types (dead — zero consumers, Session 24 duplicate) |
| `src/lib/services/study-planner-service.ts`      | 336   | Wraps plan-persistence + dynamically imports algorithm module           |
| `src/lib/study-planner/study-planner-service.ts` | 117   | Wraps algorithms.ts + notification scheduling                           |
| `src/lib/study-planner/algorithms.ts`            | 320   | Pure algorithmic planner                                                |

`plan-persistence.ts` was created in Session 24 as the "new" Dexie persistence layer, but zero components import from it. Components still use `utils/study-planner.ts`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/study-planner/` — consolidate all planner code here
- `src/lib/utils/study-planner.ts` — convert to barrel re-exporting from `src/lib/study-planner/`
- `src/lib/services/plan-persistence.ts` — DELETE
- `src/lib/services/study-planner-service.ts` — simplify to thin wrapper

**Out of scope**:

- The study planner UI components (they just import from `@/lib/utils/study-planner`, which will still work)
- The algorithmic logic in `algorithms.ts` (it's correct, just move it)
- The `DataAccess` layer

## Steps

### Step 1: Create unified types in `src/lib/study-planner/types.ts`

Define `StudySession`, `ExamDate`, `StudyPlan`, `ExamDateInfo`, and any other types currently duplicated across the 5 files. Export them from a single source. Use the most recent field definitions (from the Dexie version in `plan-persistence.ts`).

### Step 2: Create unified persistence in `src/lib/study-planner/persistence.ts`

Move all persistence functions from `plan-persistence.ts` into this file. The functions are: `loadStudyPlan`, `saveStudyPlan`, `markPlanStale`, `clearPlanStale`, `addStudySession`, `updateStudySession`, `deleteStudySession`, `addExamDate`, `deleteExamDate`, `getUpcomingSessions`, `getUpcomingExams`, `getTodaySessions`, `getStudyStats`, `autoScheduleSessions`, `generateRecurringSessions`, `recalculateProgress`.

### Step 3: Convert `src/lib/utils/study-planner.ts` to barrel

Replace the contents of `src/lib/utils/study-planner.ts` with re-exports from `src/lib/study-planner/`:

```typescript
export * from "@/lib/study-planner/types";
export * from "@/lib/study-planner/persistence";
// etc.
```

This ensures all existing imports (`@/lib/utils/study-planner`) continue to work.

### Step 4: Delete `src/lib/services/plan-persistence.ts`

After confirming the barrel re-export works and `plan-persistence.ts` has zero direct imports (check with `rg "plan-persistence" src/`), delete the file.

### Step 5: Simplify `src/lib/services/study-planner-service.ts`

Update this file to import from the unified `src/lib/study-planner/` instead of `plan-persistence.ts` and the dynamic import. Remove the fragile dynamic import pattern:

```typescript
// Before: await import("@/lib/study-planner/study-planner-service")
// After: import { ... } from "@/lib/study-planner"
```

### Step 6: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

The consolidation is mechanical — no behavior changes. Run the full test suite. Update any test imports that referenced the old file paths. Add a test to `src/lib/study-planner/__tests__/` that verifies all the core functions work from the new location.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Types are defined once in `src/lib/study-planner/types.ts`
- [ ] Persistence is defined once in `src/lib/study-planner/persistence.ts`
- [ ] `src/lib/utils/study-planner.ts` is a barrel re-export only
- [ ] `src/lib/services/plan-persistence.ts` is deleted
- [ ] `src/lib/services/study-planner-service.ts` uses static imports, not dynamic
- [ ] All existing imports (`@/lib/utils/study-planner`) still resolve
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Any of the 5 files have drifted significantly from the description
- `rg "plan-persistence" src/` finds imports outside of study planner files (means the file isn't truly dead)
- Barrel re-exports from `@/lib/utils/study-planner` cause circular dependencies
- More than N files (estimate: ~15) need import path updates — report the count

## Maintenance notes

After consolidation, ALL study planner code lives under `src/lib/study-planner/`. The `@/lib/utils/study-planner` barrel should be deprecated in favor of `@/lib/study-planner` when the team is ready to update ~15 consumer imports. Document the new location in AGENTS.md under the study planner section.
