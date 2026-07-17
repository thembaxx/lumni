# Plan 193: Add competency-driven adaptive study plan endpoint

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 690ee57f..HEAD -- src/lib/study-planner/ src/lib/services/ src/app/api/engine/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `690ee57f`, 2026-07-17
- **Issue**: (none)

## Why this matters

The study planner currently uses deterministic round-robin scheduling (`generateDeterministicSchedule` in `src/components/tools/scheduling/schedule-generator.ts:44`), which allocates equal time to all topics regardless of the student's actual competency. The product strategy doc's Sprint 2 identifies competency-driven personalization as a core differentiator — spending more time on weak topics, less on strong ones. The completion loop (wrong answers → flashcards → competency → planner reschedule) is currently broken: the planner never reads competency data.

## Current state

- `src/lib/retention-loop/next-action.ts` — `getNextBestAction()` already computes the weakest topic from competency data (lines 130-147). Used by the dashboard recommendation card.
- `src/lib/recommendation/scorer.ts` — scores topics and returns "weakest-topic" recommendations. Wired into the dashboard.
- `src/lib/analytics-engine/analytics-engine.ts` — `getWeakTopics()` (line 218) computes per-topic accuracy from competency data.
- `src/lib/services/study-planner-service.ts` — `StudyPlannerService` class (336 lines) manages plan state, sessions, exams. Has `autoScheduleSessions()` but it calls the deterministic round-robin generator.
- `src/components/tools/scheduling/schedule-generator.ts` — `generateDeterministicSchedule()` generates a flat schedule with equal topic allocation.
- API route `POST /api/engine/generate` generates questions. No `GET /api/engine/adaptive-plan` endpoint exists.
- Dexie stores competencies per subject+topic with `score` (0-100) and `bloomLevel`.

The existing `StudyPlannerService` uses dependency injection with `StudyDataAccess`:

```ts
// src/lib/services/study-planner-service.ts:31-35
export interface StudyPlannerDeps {
  db: StudyDataAccess;
}
```

And the `schedule-generator` produces `StudySession[]` with `topic`, `subjectId`, `durationMinutes`, `date` fields.

## Commands you will need

| Purpose   | Command                 | Expected on success |
| --------- | ----------------------- | ------------------- |
| Typecheck | `pnpm typecheck`        | exit 0, no errors   |
| Tests     | `pnpm test`             | all pass            |
| Lint      | `pnpm exec biome check` | exit 0              |

## Scope

**In scope**:

- `src/lib/study-planner/adaptive-planner.ts` — new file: inverse-competency-weighted schedule algorithm
- `src/app/api/engine/adaptive-plan/route.ts` — new API route
- `src/lib/study-planner/index.ts` — barrel export (add `generateAdaptivePlan`)
- `src/lib/services/study-planner-service.ts` — add `generateAdaptivePlan()` method
- `src/app/[locale]/study-plan/study-plan-client.tsx` — add "Adaptive Plan" button option

**Out of scope**:

- Modifying `schedule-generator.ts` (deterministic version still used as fallback)
- Modifying competency service or data layer
- Plan adherence tracking (deferred — needs a separate data model)
- Parent digest integration (deferred — wait for plan adherence data)

## Git workflow

- Branch: `advisor/193-adaptive-planner-v2`
- Commit style: conventional commits
- Do NOT push or open PR unless instructed

## Steps

### Step 1: Create the adaptive planner algorithm

Create `src/lib/study-planner/adaptive-planner.ts`:

An inverse-competency-weighted round-robin schedule generator. Given:

- A list of subjects and their topics, each with a competency score (0-100)
- A target number of study sessions per week
- A daily time budget (minutes)
- A start date and horizon (days)

It should:

1. Compute topic weights: `weight = 1 - (score / 100)` so a score of 30 → weight 0.7, score of 90 → weight 0.1
2. Normalize weights so they sum to 1 across all topics
3. Add a minimum floor (e.g. `max(weight, 0.05)`) so no topic gets zero time even when mastered
4. Allocate total available minutes across all topics according to normalized weights
5. Round-robin schedule the sessions across available days (weekdays only, following the existing planner convention)
6. Return `StudySession[]` compatible with `StudyPlannerService`

Type signature:

```ts
import type { StudySession } from "@/lib/study-planner";

export interface AdaptivePlanInput {
  subjectTopics: Array<{
    subjectId: string;
    subjectLabel: string;
    topicId: string;
    topicLabel: string;
    score: number; // 0-100 competency score
  }>;
  targetDailyMinutes: number; // default 30
  targetAps: number; // ignored in v1, reserved for future
  horizonDays: number; // default 30
  startDate?: string; // ISO date, default today
  weekdaysOnly?: boolean; // default true
}

export interface AdaptivePlanResult {
  sessions: StudySession[];
  allocations: Array<{
    subjectId: string;
    topicId: string;
    topicLabel: string;
    totalMinutes: number;
    sessionCount: number;
    weight: number;
    score: number;
  }>;
}

export function generateAdaptivePlan(input: AdaptivePlanInput): AdaptivePlanResult;
```

Follow the coding style of `schedule-generator.ts` (adjacent file, same directory) — use the same `StudySession` type import, same session structure, same date utilities.

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Create the API route

Create `src/app/api/engine/adaptive-plan/route.ts`:

```ts
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { generateAdaptivePlan } from "@/lib/study-planner/adaptive-planner";

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "AdaptivePlan",
  parseBody: async (req) => {
    const body = await req.json();
    return {
      targetDailyMinutes: body.targetDailyMinutes ?? 30,
      targetAps: body.targetAps ?? 25,
      horizonDays: body.horizonDays ?? 30,
    };
  },
  execute: async ({ body, userId }) => {
    // Fetch competencies from Dexie (via the existing competency service)
    // Map to AdaptivePlanInput.subjectTopics
    // Call generateAdaptivePlan()
    // Return the result
  },
});
```

The route handler should:

1. Use `CompetencyService.getCompetenciesForUser(userId)` (or equivalent) to fetch all competencies
2. Filter to subjects/topics the user has studied
3. Map to the `AdaptivePlanInput` shape
4. Call `generateAdaptivePlan()`
5. Return the sessions and allocations

Check `src/lib/competency-engine/` for the service API. It should have a method to get all competencies for a user.

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Add `generateAdaptivePlan()` to `StudyPlannerService`

Add a method to `StudyPlannerService` that:

1. Calls the adaptive plan API route (or calls `generateAdaptivePlan()` directly with competency data from the local Dexie)
2. Replaces the current plan's sessions with the adaptive ones
3. Notifies listeners (plan updated)
4. Persists via `saveStudyPlan()`

The route-based approach (Step 2) is the primary path. The service method should fetch from the API and merge into the existing plan state.

**Verify**: `pnpm typecheck` exits 0.

### Step 4: Add "Adaptive Plan" option to study planner UI

In `src/app/[locale]/study-plan/study-plan-client.tsx`, add a secondary button or toggle next to the existing "Generate Plan" flow:

- "Generate Standard Plan" (existing deterministic round-robin — keep as default)
- "Generate Adaptive Plan" (new — calls `generateAdaptivePlan` via the API)

Show the allocations from the adaptive result as a small table or list below the plan, explaining which topics get more time and why ("Topic X needs more practice — score: 40%").

The button should call `POST /api/engine/adaptive-plan` with the user's target settings.

**Verify**: `pnpm typecheck` exits 0.

### Step 5: Run full verification

```bash
pnpm typecheck && pnpm exec biome check && pnpm test
```

All should pass.

## Test plan

- New tests:
  - `src/lib/study-planner/__tests__/adaptive-planner.test.ts` — test the algorithm:
    - Equal competencies → equal time allocation
    - Zero competency → highest weight (with floor)
    - Full competency (100) → minimum weight (0.05)
    - Total allocated minutes == total available minutes
    - `horizonDays` produces correct number of weekdays
  - Follow the pattern in any existing `__tests__` file in `src/lib/study-planner/`
  - `src/app/api/engine/__tests__/adaptive-plan-route.test.ts` — mock competencies, assert response shape
- No new tests needed for `StudyPlannerService` if the method is thin delegation

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0 (including new tests)
- [ ] `GET /api/engine/adaptive-plan` returns `{ sessions, allocations }` with correct weighted distribution
- [ ] A topic with score 20 gets ~4× the time of a topic with score 80
- [ ] Study planner UI shows "Generate Adaptive Plan" button
- [ ] Allocations table renders below the generated plan
- [ ] Only files in scope are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The competency service doesn't have a `getAllCompetencies()` or equivalent method — check `src/lib/competency-engine/service.ts` and report the available API
- The `StudyPlannerService.saveStudyPlan()` doesn't accept replacement session arrays (it may only append) — check and report
- The study plan client component is server-rendered and can't easily add a button to the existing "Generate Plan" flow

## Maintenance notes

- The adaptive algorithm in v1 is intentionally simple (inverse-weight round-robin). Future versions should add: blocked scheduling (2h blocks), spaced topic rotation, and exam-date awareness (more time before a close exam).
- Plan adherence tracking (did they complete the planned sessions?) is the next logical step after this. Wire the completed sessions to update competency, creating a closed feedback loop.
- The `targetAps` field is reserved but ignored in v1. It should eventually cap the total weekly load (more ambitious targets → more sessions).
