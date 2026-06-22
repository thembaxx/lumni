# Plan → React Integration Design

**Date:** 2026-05-31
**Status:** Draft

## Problem

The study planner generates once and never reacts. Competency changes from quiz results, national exam dates, and session completions have no effect on the plan until the user manually regenerates.

## Solution

Hybrid stale/regenerate mechanism: events mark the plan as "stale", the user sees a prompt to regenerate, and weekly auto-refresh handles the silent case.

## Mechanism

### Stale tracking

The localStorage `StudyPlan` object gains two fields:

```typescript
interface StudyPlan {
  // ...existing fields...
  stale: boolean; // true when events suggest a rebalance
  lastCompetencyRefresh: number; // epoch ms of last competency read
}
```

### Events that set `stale = true`

| Event                      | Trigger location                                |
| -------------------------- | ----------------------------------------------- |
| Quiz finished              | `dashboard-client.tsx` after `handleFinishQuiz` |
| Exam submitted             | `exam-session-client.tsx` after submit          |
| Session completed          | `use-study-planner.ts` `markComplete()`         |
| Plan settings changed      | `StudyPlanOverview` form submit                 |
| National exam dates loaded | After `getExamDates()` returns data             |

### Events that clear `stale = false`

| Event                  | Location                                     |
| ---------------------- | -------------------------------------------- |
| Plan regenerated       | `use-study-planner.ts` `generatePlan()` exit |
| Auto-refresh completes | `StudyPlanOverview` weekly check             |

### UI: Stale banner

`StudyPlanOverview` shows a non-blocking banner above the plan when `stale === true`:

> "Your competency scores have changed. [Regenerate plan →]"

Three-dot menu on the plan card also gets a "Regenerate from latest data" item.

Morning-tea style: user can dismiss the banner (sets a `bannerDismissedAt` field, re-shows after 24h if still stale).

### Weekly auto-refresh

On dashboard mount, if `plan.lastCompetencyRefresh + 7 days < Date.now()`, auto-call `generatePlan()` with the same settings. Silently replaces the plan. User can opt out by manual-dismissing the auto-refresh (stores `autoRefreshOptOut` in settings).

## Exam Dates Integration

### Import bridge

A new utility `mergeNationalExamDates()` reads `ExamSlot[]` from the exam-dates service and merges them into the planner's `ExamDate[]` format. Called during `generatePlan()` and whenever national exam dates change.

### Algorithm impact

The `generateStudyPlan()` algorithm gains an `examDates: ExamSlot[]` parameter:

1. **endDate**: `min(userHorizon, earliestExamDate - 1)`. No new material on exam day.
2. **Subject weight boost**: For each subject with an exam ≤14 days away, multiply its inverse-competency weight by 1.2 (normalised to keep sum = 1).
3. **Exam-day sessions**: If a study date falls on an exam date for the same subject, session type = "review" instead of "quiz".
4. **Rest days before exams**: The algorithm already enforces 1 rest day per 7-day window. Extended to: if a study date is the day before an exam for that subject, never schedule that subject.

## Files Changed

| File                                                 | Change                                                                                                           |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils/study-planner.ts`                     | `stale` + `lastCompetencyRefresh` fields, `markPlanStale()`, `mergeNationalExamDates()`, `getWeekOldTimestamp()` |
| `src/lib/utils/study-planner.ts`                     | `saveStudyPlan()` sets `stale: false` on save                                                                    |
| `src/hooks/use-study-planner.ts`                     | `markComplete()` calls `markPlanStale()`, `isStale` computed property, `generatePlan()` clears stale             |
| `src/lib/study-planner/study-planner-service.ts`     | `generateStudyPlan()` accepts `examDates: ExamSlot[]`, calls `mergeNationalExamDates()`, passes to algorithm     |
| `src/lib/study-planner/algorithms.ts`                | `generateStudyPlan()` gains `examDates` param: exam-aware endDate, weight boost, rest days                       |
| `src/lib/study-planner/types.ts`                     | No changes (algorithm types already separate from storage types)                                                 |
| `src/components/dashboard/study-plan-overview.tsx`   | Stale banner, weekly auto-refresh check, three-dot regenerate                                                    |
| `src/components/dashboard/dashboard-client.tsx`      | After `handleFinishQuiz()`, import and call `markPlanStale()`                                                    |
| `src/app/[locale]/exam/[id]/exam-session-client.tsx` | After submit, import and call `markPlanStale()`                                                                  |

## What's NOT in scope

- No new Dexie tables or migrations (all localStorage)
- No new API routes
- No new hooks
- No push notifications for plan changes
- No undo for auto-refresh (user can manually regenerate if they dislike it)
- No plan versioning or diff display
