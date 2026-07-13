---
status: TODO
priority: P2
effort: S
risk: LOW
confidence: MED
created: 2026-07-12
commit: 4fcd46a4
---

# 174 — Study-plan generation: redundant `getCompetencies` reads

## Context

`StudyPlannerService.getAllSubjectsCompetency()` calls **both** `getMasterySummary(subject.id)` and `getCompetencies(subject.id)` per subject. `getMasterySummary` internally re-calls `getCompetencies`, so each subject costs 3 Dexie reads (2 redundant), = 27 reads total across 9 subjects — on a user-triggered "Generate Plan" action.

## Current state (verified)

`src/lib/study-planner/study-planner-service.ts:69-95`

```ts
private async getAllSubjectsCompetency(): Promise<SubjectCompetency[]> {
  const results = await Promise.allSettled(
    KNOWN_SUBJECTS.map(async (subject) => {
      const [summary, records] = await Promise.all([
        this.competencyService.getMasterySummary(subject.id),
        this.competencyService.getCompetencies(subject.id),
      ]);
      ...
```

`src/lib/competency-engine/competency-service.ts` — `getMasterySummary` (around lines 142-162) re-invokes `getCompetencies`.

## Goal

Read `getCompetencies` once per subject, derive the mastery summary locally, and drop the redundant call.

## Steps

1. Read `src/lib/competency-engine/competency-service.ts` `getMasterySummary` and `getCompetencies` to understand the summary computation (it returns `{ averageScore, ... }` derived from the records).
2. In `study-planner-service.ts`, change `getAllSubjectsCompetency` to call `getCompetencies` once, then compute the summary inline (replicating `getMasterySummary`'s math) instead of calling it:
   ```ts
   const records = await this.competencyService.getCompetencies(subject.id);
   const averageScore = records.length
     ? Math.round(records.reduce((s, r) => s + (r.score ?? 0), 0) / records.length)
     : 0;
   ```
   (Match `getMasterySummary`'s exact formula — read it to be sure.)
3. If `getMasterySummary` is cheap to refactor, alternatively add an overload `getMasterySummaryFrom(records)` that `getMasterySummary` itself calls, and use it here — keeps a single source of truth. Prefer this if the formula is non-trivial.
4. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/study-planner/study-planner-service.ts`, possibly `src/lib/competency-engine/competency-service.ts` (add a shared summary helper).
- Out of scope: the planning algorithm (`generateStudyPlan`), reminder scheduling.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/study-planner` → pass; assert `getCompetencies` is called once per subject (spy).

## Test plan

- Extend `src/lib/study-planner/__tests__/*`: spy on `competencyService.getCompetencies` and `getMasterySummary`; after `generateStudyPlan`, assert `getCompetencies` called exactly 9 times (once per subject) and `getMasterySummary` is not called from the planner. Mirror existing study-planner test mocking.

## Maintenance

- If `getMasterySummary`'s formula changes later, update the shared helper (step 3) so the planner stays consistent.

## Escape hatches

- If `getMasterySummary` includes more than a simple average (e.g. weighted by recency), use the shared-helper approach (step 3) rather than re-implementing inline, to avoid divergence.
