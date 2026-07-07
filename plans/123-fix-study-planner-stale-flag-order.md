# Plan 123: Fix study planner stale-flag persistence ordering

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a79c0e7c..HEAD -- src/lib/services/study-planner-service.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `a79c0e7c`, 2026-07-06

## Why this matters

In `generatePlan`, `clearPlanStale()` writes the old session list with `stale: false` BEFORE `saveStudyPlan(existingPlan)` persists the new plan. If an exception occurs between these calls, the on-disk plan has `stale: false` but outdated sessions, and the plan never regenerates until a page reload.

## Current state

`src/lib/services/study-planner-service.ts:258-264`:

```ts
existingPlan.generatedAt = Date.now();
clearPlanStale(); // ← marks plan fresh BEFORE persisting
saveStudyPlan(existingPlan); // ← persists the new plan
schedulePlanAwareReminder();
this.plan = existingPlan;
this.syncToAppwrite();
this.notify();
```

If `saveStudyPlan` throws (disk full, quota exceeded), the plan is marked fresh but the new data is lost.

## Commands you will need

| Purpose   | Command                          | Expected on success |
| --------- | -------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`             | exit 0, no errors   |
| Tests     | `pnpm run test -- study-planner` | all pass            |

## Steps

### Step 1: Swap the order

Move `clearPlanStale()` to AFTER `saveStudyPlan(existingPlan)`:

```ts
existingPlan.generatedAt = Date.now();
saveStudyPlan(existingPlan); // ← persist first
clearPlanStale(); // ← then mark fresh
schedulePlanAwareReminder();
this.plan = existingPlan;
this.syncToAppwrite();
this.notify();
```

Now if `saveStudyPlan` throws, the plan remains stale and will be regenerated on next attempt.

**Verify**: `pnpm exec oxlint src/lib/services/study-planner-service.ts` → 0 errors

### Step 2: Verify

**Verify**: `pnpm run typecheck` → exit 0
**Verify**: `pnpm run test` → all pass

## Done criteria

- [ ] `clearPlanStale()` called AFTER `saveStudyPlan()`
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `plans/README.md` status row updated

## STOP conditions

- `clearPlanStale()` has side effects that must happen before `saveStudyPlan` (check implementation)
- The reordering breaks an existing test
