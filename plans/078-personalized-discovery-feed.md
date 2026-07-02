# Plan 078: Personalized Discovery Feed (Phase 1)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 53532ff1..HEAD -- src/lib/retention-loop/ src/components/dashboard/today-tab.tsx src/components/dashboard/next-best-action.tsx src/lib/recommendation/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Category**: direction
- **Depends on**: none (Plan 076 optional — leaderboard signal enriches feed but not required)
- **Planned at**: commit `53532ff1`, 2026-07-02

## Why this matters

The dashboard renders 18+ static cards in a fixed grid — DailyChallengeCard, StreakCard, NextBestActionCard (rule-based single suggestion), QuestionOfTheDayCard (random subject from hardcoded list of 9), WordOfDayCard, FocusTimerCard, WeakTopicsCard. None is personalized beyond showing the user's weakest topic. The platform has rich data (competency scores, exam proximity, flashcard due counts, study plan) but no feed that ranks content by relevance. This replaces the static single-suggestion card with a ranked, scored feed of 3-5 recommendations — reducing "what should I study?" paralysis.

## Current state

- `src/components/dashboard/today-tab.tsx:53-198` — 18 card components in three collapsible sections, statically ordered. The "Priority" section has `NextBestActionCard` as the second item.
- `src/lib/retention-loop/next-action.ts:14-31` — returns ONE `NextAction` using linear priority: due-cards > review-mistakes > weakest-topic > study-plan > exam-practice.
  ```ts
  export type ActionKind =
    | "weakest-topic"
    | "exam-practice"
    | "due-cards"
    | "study-plan"
    | "flashcards"
    | "review-mistakes";
  ```
- `src/components/dashboard/next-best-action.tsx` — renders a single suggestion card from `getNextAction()`.
- `src/components/dashboard/question-of-the-day-card.tsx` — picks random subject from hardcoded list of 9.
- Data infrastructure available: `competencyService` (per-topic scores), `src/lib/exam-dates/service.ts` (exam proximity), `FlashcardEngine` (due card count), `studyPlannerService` (plan adherence), `next-action.ts` (existing rule engine).

**Repo conventions to follow**:

- New components in `src/components/dashboard/` follow the card pattern from `CompetitionCard` (`rounded-2xl`, `press-scale`, `gap-3`, `Card` primitive)
- New lib modules in `src/lib/recommendation/` use DI pattern with `_deps` + `__setDepsForTesting()` — see `src/lib/competitions/service.ts` for exemplar
- Error handling uses `logError()` from `@/lib/shared/logger`
- Dashboard cards use `useQuery` with `refetchInterval` for live data

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Typecheck | `pnpm run typecheck`     | exit 0              |
| Tests     | `pnpm run test`          | exit 0              |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/recommendation/scorer.ts` (new) — scoring model
- `src/lib/recommendation/index.ts` (new) — barrel export
- `src/lib/retention-loop/next-action.ts` — extend with `getFeed()` export, keep backward compat
- `src/components/dashboard/personalized-feed.tsx` (new) — feed UI component
- `src/components/dashboard/today-tab.tsx` — replace `NextBestActionCard` with `PersonalizedFeed`
- `src/lib/recommendation/__tests__/scorer.test.ts` (new) — tests

**Out of scope**:

- A/B testing framework
- Real-time personalization via WebSockets
- Push-based feed updates (keep simple: re-query on mount and on quiz completion)
- Changes to `QuestionOfTheDayCard` or `WeakTopicsCard` — those remain for Phase 2
- Replacing the entire dashboard layout — Phase 1 only replaces the Priority section

## Steps

### Step 1: Build the scoring model

Create `src/lib/recommendation/scorer.ts`:

```ts
export interface ScoredRecommendation {
  kind: ActionKind;
  title: string;
  reason: string;
  ctaHref: string;
  ctaLabel: string;
  score: number;
  subject?: string;
  topic?: string;
}

export interface ScorerDeps {
  // Query functions returning a relevance score (0-100) per dimension
  getDueCardsCount?: (userId: string) => Promise<number>;
  getWeakestTopic?: (
    userId: string,
  ) => Promise<{ subject: string; topic: string; score: number } | null>;
  getUpcomingExam?: (userId: string) => Promise<{ subject: string; daysUntil: number } | null>;
  getStudyPlanAdherence?: (userId: string) => Promise<number>;
  getHoursSinceLastPractice?: (userId: string) => Promise<number>;
}
```

Implement `getRankedRecommendations(userId: string, deps: ScorerDeps, limit?: number): Promise<ScoredRecommendation[]>`:

1. **Exam proximity score** (weight: 0.35): If an exam is within 30 days, score = `(30 - daysUntil) / 30 * 100`. Above 30 days, score = 0.
2. **Weak topic score** (weight: 0.30): If weakest topic has score < 60, score = `(60 - score) * 1.67`. Above 60, score = 0.
3. **Due cards score** (weight: 0.20): `Math.min(dueCardsCount * 10, 100)`.
4. **Time since practice score** (weight: 0.15): `Math.min(hoursSinceLastPractice / 24 * 20, 100)`.

Combine: `totalScore = examScore * 0.35 + weakTopicScore * 0.30 + dueCardsScore * 0.20 + recencyScore * 0.15`

Return top N by score, each mapped to a `ScoredRecommendation` with appropriate `ctaHref` (e.g., `/quiz?subject=X&topic=Y`).

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Extend next-action.ts

Add `getFeed(userId: string, deps: ScorerDeps, limit?: number): Promise<ScoredRecommendation[]>` to `src/lib/retention-loop/next-action.ts` that imports and delegates to the scorer. Keep `getNextAction()` unchanged (returns `getFeed(..., 1)[0]` or null).

**Verify**: `pnpm run typecheck` → exit 0. Existing consumers of `getNextAction()` still work.

### Step 3: Build feed UI component

Create `src/components/dashboard/personalized-feed.tsx`:

- Receives `recommendations: ScoredRecommendation[]` prop.
- Renders up to 5 cards in a vertical stack with `gap-3`.
- Each card: small Card with icon (use `HugeiconsIcon` — choose icons by `kind`), title, reason text, CTA link button.
- Subtle rank indicator: small numbered badge on the left edge (1, 2, 3... with `tabular-nums`).
- First card has slightly larger font / emphasis treatment.
- Uses framer-motion `StaggerList` for entrance animation (import from `@/components/shared/stagger-list`).

Pattern to follow — model styling after the existing card body in `next-best-action.tsx`.

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Wire into dashboard

In `src/components/dashboard/today-tab.tsx`:

1. Import `PersonalizedFeed`.
2. Replace the `<NextBestActionCard />` block (around lines 97-102) with `<PersonalizedFeed recommendations={rankedRecs} />`. Keep it inside the same `AppErrorBoundary` and `StaggeredSection`.
3. Use a `useQuery` to call `getFeed()` — pass the userId and `ScorerDeps` from existing services. Keep `refetchInterval: 60000` and refetch on quiz completion (extend the existing refetch trigger).
4. Keep `NextBestActionCard` as a fallback — when feed returns empty, show the single card.

**Verify**: `pnpm run typecheck` → exit 0. Dashboard shows feed when recommendations exist, falls back to next-best-action when empty.

### Step 5: Add tests

Create `src/lib/recommendation/__tests__/scorer.test.ts`:

- Mock each scorer dimension independently.
- Test that exam proximity scoring returns correct values for various days-until values.
- Test that combined scoring ranks items in expected order.
- Test empty state (no due cards, no weak topics, no exams — returns empty array).

**Verify**: `vitest run src/lib/recommendation/` → exit 0, all tests pass.

## Test plan

- `src/lib/recommendation/__tests__/scorer.test.ts` — 4-5 test cases
- `pnpm run test` — all pass
- Manual: verify feed renders on dashboard with different mocked data

## Done criteria

- [ ] `getRankedRecommendations()` returns scored, ranked recommendations with weights
- [ ] `PersonalizedFeed` component renders up to 5 ranked cards with reasons
- [ ] Dashboard Priority section shows feed instead of single next-best-action
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The `StaggerList` or `StaggeredSection` imports are missing from the codebase (stop and check if they were removed — use simpler `framer-motion` animation instead).
- The scorer deps require async queries that don't yet exist (stop and stub with mock data, flag to reviewer).
- `NextBestActionCard` has been significantly restructured since this plan was written.

## Maintenance notes

- The weights (0.35, 0.30, 0.20, 0.15) are initial guesses — the plan deliberately avoids an experimentation framework, but a Phase 2 could A/B test them.
- Phase 2 could add more dimensions: peer activity ("3 students practiced Trigonometry today"), leaderboard position, daily challenge incompleteness.
- The feed refetches on timer and quiz completion — no push mechanism. If the app adds a real-time layer, the feed is a natural consumer.
