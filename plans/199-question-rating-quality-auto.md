# Plan 199: Auto-deprecate poor questions from ratings feedback

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Issue**: (none)

## Why this matters

The `QuestionRating` Dexie table (v8, from Session 4) collects star ratings (1-5) every time a user rates a question. But there's zero automated response: a question with 50 ratings averaging 1.8 stars keeps getting served to new users. This plan adds a quality threshold check: questions below 2.5★ average after 10+ ratings are auto-deprecated (marked `pruned: true`) and excluded from generation pools.

## Current state

- `src/lib/question-rating/service.ts` — `QuestionRatingService` with `submitRating(userId, questionId, rating, metadata?)` — writes to `questionRatings` Dexie table
- `src/components/question-rating/star-rating.tsx` — star input component
- `src/components/question-rating/question-ratings-dashboard.tsx` — admin dashboard with star distribution chart (in admin/quality)
- `Question` type has `pruned?: boolean` field (from Session 25 item-bank pruning job type)
- No code reads `pruned` to filter generation pools

## Steps

### Step 1: Create quality threshold checker

Create `src/lib/question-rating/quality-gate.ts`:

```ts
export interface QualityGateConfig {
  minRatings: number;      // minimum ratings before deprecation (default: 10)
  threshold: number;       // max average rating below which deprecation triggers (default: 2.5)
}

export interface QualityGateResult {
  questionId: string;
  avgRating: number;
  ratingCount: number;
  action: "keep" | "deprecate";
}

export function checkQuestionQuality(
  ratings: { rating: number }[],
  config?: Partial<QualityGateConfig>,
): QualityGateResult { ... }

export async function deprecateLowQualityQuestion(
  questionId: string,
  db: { questions: DataAccessTable<Question, string> },
): Promise<void> {
  // Sets question.pruned = true
}
```

Pure function for `checkQuestionQuality` — no side effects. `deprecateLowQualityQuestion` writes to Dexie.

### Step 2: Wire into question generation pool

In `src/lib/question-engine/question-engine.ts` or the pool adapter (`src/lib/question-engine/adaptive-selector.ts`):

Before selecting questions from the pool, filter out any where `pruned === true`. If this is done at the `getAvailableQuestions()` level, all consumers (quiz gen, daily bolt, exam) automatically skip deprecated questions.

Search for the pool query — likely in `src/lib/question-engine/pool-adapter.ts` or `adaptive-selector.ts` — and add a `.filter(q => !q.pruned)` or Dexie `filter()` call.

### Step 3: Create batch deprecation job

Create job type `"deprecate-low-quality-questions"` in the orchestrator domain handlers (follow pattern from `prune-stale-questions` job in Session 25):

1. Query all questions with 10+ ratings from `questionRatings`
2. For each, compute average rating
3. If avg < 2.5, set `pruned: true` on the question
4. Batch commit

This job runs weekly (enqueue from a cron or from the admin quality dashboard button).

### Step 4: Show deprecation status in admin dashboard

In `src/components/question-rating/question-ratings-dashboard.tsx`:

- Add a column showing whether each question is pruned
- Add a "Deprecate" / "Restore" button for manual override
- Show a summary: "N low-quality questions identified, M deprecated"

### Step 5: Verify

```bash
pnpm typecheck
pnpm exec biome check
pnpm test
```

## Test plan

- `src/lib/question-rating/__tests__/quality-gate.test.ts`:
  - Ratings above threshold with enough count → "keep"
  - Ratings below threshold with enough count → "deprecate"
  - Not enough ratings (< minRatings) → "keep" regardless of avg
  - Edge case: exactly threshold (e.g., 2.5 with 10 ratings) → "keep" (inclusive)
  - Empty ratings array → "keep"
- Pool query test: verify `pruned: true` questions are excluded from generation

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] Questions with < 2.5★ avg after 10+ ratings are auto-deprecated
- [ ] Deprecated questions excluded from generation pools
- [ ] Admin dashboard shows deprecation status with manual override
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report if:

- The pool query uses compound Dexie indexes that can't easily add a `.filter()` — check `src/lib/question-engine/pool-adapter.ts` or equivalent for how questions are queried. If it uses `.where("subjectId").equals(subject).toArray()`, the filter is trivial. If it uses a compound index, the approach may need adjustment.
- `Question.pruned` field doesn't exist on the type — check `src/lib/question-engine/types.ts`. If absent, add it (non-breaking, optional).

## Maintenance notes

- The 2.5 threshold and 10 minimum ratings are configurable via `QualityGateConfig` — no hardcoding
- Manual "Restore" on a question resets `pruned` to `false` but doesn't reset its rating history — a question restored but still poorly rated will be re-deprecated on the next batch job
- Consider adding a "report" button alongside star ratings for content issues (wrong answer, typo) — deferred, future plan
