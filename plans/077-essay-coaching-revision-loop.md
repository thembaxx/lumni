# Plan 077: Essay Coaching with Iterative Revision Loop

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 53532ff1..HEAD -- src/lib/question-engine/processors/graders/essay.ts src/lib/question-engine/prompts/ src/lib/db/schema.ts src/components/quiz/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Category**: direction
- **Depends on**: none
- **Planned at**: commit `53532ff1`, 2026-07-02

## Why this matters

The essay grader is a 24-line single-shot AI prompt — submit draft, get score + feedback, done. No revision tracking, no side-by-side draft comparison, no iterative coaching loop. Essays and long answers account for 30-50% of marks in Matric languages, history, geography, and many other subjects. A multi-turn coaching loop (draft → feedback → revise → regrade with improvement tracking) would be genuinely transformative for student writing skills. The AI client chain, grading pipeline, and rubric types are all in place — only the coaching-specific prompt and revision data model are missing.

## Current state

- `src/lib/question-engine/processors/graders/essay.ts:5-19` — single-shot grading:
  ```ts
  export const grade: GradeFn = (q, a, prompts, ai) => {
    const student = a.value as string;
    if (!student || student.trim().length < 20) {
      return Promise.resolve({ correct: false, score: 0, maxScore: q.points, feedback: "Essay is too short to grade." });
    }
    return aiGradeResult(q, a, prompts, ai, (q: Question, _a: UserAnswer) => {
      const b = q.body as QuestionBody["essay"];
      return `Question: ${q.questionText}\nRubric: ${JSON.stringify(b.rubric)}\nModel answer: ${b.modelAnswer}\nStudent essay: ${_a.value as string}`;
    });
  };
  ```
- `src/lib/question-engine/prompts/grade.ts:13-16` — essay grading prompt: "Evaluate the essay against the rubric. Return JSON: { correct, score, maxScore, feedback, breakdown }"
- `essay.ts:21-24` — `hint()` returns generic "Structure your essay around these criteria: ..." — no content-aware guidance based on student's draft.
- `QuestionBody["essay"]` has `rubric: RubricCriterion[]` and `modelAnswer: string`.
- No `essayDrafts` Dexie table exists.
- Dexie schema is in `src/lib/db/schema.ts`.

**Repo conventions to follow**:
- Graders use `aiGradeResult()` from `./shared` — import and wrap the AI call
- Prompt templates follow the `PromptTemplate` shape from `src/lib/question-engine/prompt-manager.ts`
- Dexie table definitions go in `src/lib/db/schema.ts` — add a new table with proper key/index definitions
- Components use `"use client"` directive, framer-motion for animations, shadcn Card/Button/Textarea primitives
- Error handling uses `logError()` from `@/lib/shared/logger`

## Commands you will need

| Purpose   | Command                        | Expected on success |
|-----------|--------------------------------|---------------------|
| Typecheck | `pnpm run typecheck`           | exit 0              |
| Tests     | `pnpm run test`                | exit 0              |
| Lint      | `pnpm exec oxlint --fix`       | exit 0              |
| Format    | `pnpm exec oxfmt --check`      | exit 0              |

## Scope

**In scope**:
- `src/lib/db/schema.ts` — add `essayDrafts` table to Dexie schema
- `src/lib/question-engine/prompts/essay-coach.ts` (new) — coaching-specific prompts
- `src/lib/question-engine/processors/graders/essay.ts` — extend with revision support
- `src/components/quiz/QuestionCardFeedback.tsx` — add coaching UI
- `src/lib/question-engine/types.ts` (read only) — `RubricCriterion` reference

**Out of scope**:
- Long-answer coaching (same pattern, deferred)
- Auto-saving drafts on page exit
- Appwrite sync of essay drafts
- Changes to exam session flow
- Pronunciation or other question types

## Steps

### Step 1: Add `essayDrafts` Dexie table

In `src/lib/db/schema.ts`, add:

```ts
export interface EssayDraftRecord {
  id?: number;
  userId: string;
  questionId: string;
  draftNumber: number;
  content: string;
  aiFeedback: string;       // JSON string of GradingResult
  score: number;
  maxScore: number;
  createdAt: number;
}
```

Add to the Dexie schema version string (increment version number, e.g., from v41 to v42):
```
essayDrafts: "++id, userId, questionId, [userId+questionId]"
```

Export from the data access interface and DexieDataAccess/InMemoryDataAccess implementations. Follow the pattern of a simple table like `pronunciationHistory`.

**Verify**: `pnpm run typecheck` → exit 0. `pnpm run test` → exit 0 (existing schema test passes).

### Step 2: Create coaching prompts

Create `src/lib/question-engine/prompts/essay-coach.ts`:

```ts
import type { PromptTemplate } from "../prompt-manager";

export const COACH_PROMPT: PromptTemplate = {
  system: `You are an experienced essay coach. Your job is to help students improve their writing through specific, actionable feedback. Always be encouraging but honest. Focus on: thesis clarity, argument structure, evidence quality, counterargument consideration, and conclusion strength. For each criterion, explain WHAT needs improvement and HOW to improve it.`,
  user: (params: { question: string; rubric: string; modelAnswer: string; currentDraft: string; previousFeedback?: string }) =>
    `Question: ${params.question}\nRubric: ${params.rubric}\nModel answer: ${params.modelAnswer}\n` +
    (params.previousFeedback ? `Previous feedback: ${params.previousFeedback}\n` : "") +
    `Current draft: ${params.currentDraft}\n\n` +
    `Return JSON: { score: number, maxScore: number, feedback: string, improvementHints: string[], improvementTracker?: { criterion: string, previousScore: number | null, newScore: number, feedback: string }[] }`,
};
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Extend the essay grader

Modify `src/lib/question-engine/processors/graders/essay.ts`:

1. Accept an optional `previousDrafts` parameter (array of `{ draftNumber, content, aiFeedback }`) in the grade function signature. Type: `GradeFn` already accepts `(q, a, prompts, ai)`. Use optional deps or a separate export.

2. When `previousDrafts` is non-empty, use `COACH_PROMPT` instead of the standard grade prompt. Pass `previousFeedback` from the last draft's `aiFeedback`.

3. Extract `improvementHints` and `improvementTracker` from the AI response and include them in the feedback string.

4. After grading, save the draft to the `essayDrafts` Dexie table via DataAccess.

The modified`grade()` logic:
```ts
export const grade: GradeFn = (q, a, prompts, ai, deps?) => {
  const student = a.value as string;
  if (!student || student.trim().length < 20) {
    return Promise.resolve({ correct: false, score: 0, maxScore: q.points, feedback: "..." });
  }
  const previousDrafts = deps?.previousDrafts ?? [];
  const isRevision = previousDrafts.length > 0;

  return aiGradeResult(q, a, isRevision ? COACH_PROMPT : prompts, ai, (q, _a) => {
    const b = q.body as QuestionBody["essay"];
    const base = `Question: ${q.questionText}\nRubric: ${JSON.stringify(b.rubric)}\nModel answer: ${b.modelAnswer}\nStudent essay: ${_a.value as string}`;
    if (!isRevision) return base;
    return `${base}\nPrevious feedback: ${previousDrafts[previousDrafts.length - 1].aiFeedback}`;
  });
};
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Build coaching UI in QuestionCardFeedback

In `src/components/quiz/QuestionCardFeedback.tsx`:

1. After the existing feedback display for essay/long-answer questions, add a "Get Coaching" button that toggles a revision textarea.
2. The textarea is pre-filled with the student's last draft. Student edits and clicks "Submit Revision".
3. On submit, call `POST /api/engine/grade` with the revised essay plus `previousDrafts` metadata (stored in local state).
4. Show the new feedback below, with a comparison of per-criterion scores (improvement tracker). Use a simple table or pill badges: "Structure: 3/5 → 4/5 ✓".
5. Allow up to 3 revision rounds. After that, show "Great work! You've made 3 revisions — time to move on."

Use the existing `useGradeEssay` or create a new `useEssayCoaching` hook in `src/hooks/use-essay-coaching.ts` that manages revision state (drafts, current revision count, loading states).

**Verify**: `pnpm run typecheck` → exit 0. Coaching UI appears on essay-type questions, supports at least 2 revision rounds.

### Step 5: Add tests

Create `src/lib/question-engine/__tests__/essay-coach.test.ts`:

- Test that `grade()` with no previous drafts uses the standard prompt (returns `{ score, feedback }` without `improvementTracker`).
- Test that `grade()` with previous drafts includes `improvementTracker` in the response.
- Test the save-to-Dexie on grade.

**Verify**: `pnpm run test` → exit 0, new tests pass.

## Test plan

- New file: `src/lib/question-engine/__tests__/essay-coach.test.ts` — 3 test cases
- Existing grader tests still pass (`vitest run src/lib/question-engine/processors/graders/`)
- `vitest run src/lib/db/` — schema migration test passes

## Done criteria

- [ ] `essayDrafts` Dexie table exists and is queryable by `userId + questionId`
- [ ] Essay grading with revision context uses coaching prompt and returns `improvementTracker`
- [ ] `QuestionCardFeedback` shows coaching UI for essay questions with 3 revision rounds
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0, new tests exist
- [ ] No files outside the in-scope list are modified

## STOP conditions

- The `GradeFn` type doesn't accept a deps/context parameter (stop and check type definition — may need a type extension).
- The `QuestionCardFeedback` component structure has changed significantly (stop and describe the current structure before adding coaching).
- The essay grader prompt format has been reworked since this plan was written.

## Maintenance notes

- The 3-revision limit is arbitrary — make it configurable via a constant at the top of `essay-coach.ts`.
- When `improvementTracker` shows zero progress across revisions, the coach prompt could escalate: "You don't seem to be incorporating feedback on [criterion]. Let's focus on just that one area."
- Long-answer coaching can use the same pattern — extract the shared prompt logic when implementing that follow-up.
