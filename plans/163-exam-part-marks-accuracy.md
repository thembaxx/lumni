---
status: TODO
priority: P1
effort: S
risk: LOW
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 163 — Exam `score` ignores `part.marks` (competency under-credited)

## Context

Each exam part carries a `marks` value, but the exam result records `score: correct ? 1 : 0` regardless of marks. Downstream, `processExamEffect` computes `maxScore = part.marks ?? score`, so a correct 5-mark part becomes `score=1, maxScore=5`, and `trackQuestionResult` reports accuracy `round(1/5*100)=20%`. This systematically **under-credits** multi-mark exam parts, skewing competency/mastery and therefore "weakest topic" routing and next-best-action suggestions. (The visible exam percentage uses `correctCount/totalCount`, so it is unaffected — only the per-part competency feed is wrong.)

## Current state (verified)

`src/hooks/use-exam-session.ts:136`

```ts
score: correct ? 1 : 0,
```

`src/lib/services/quiz-result-processor/exam.ts:29`

```ts
const maxScore = typeof result.part.marks === "number" ? result.part.marks : result.score;
```

`src/lib/orchestrator/track-result.ts:24`

```ts
const accuracy = maxScore > 0 ? Math.round((score / maxScore) * 100) : score >= 0.5 ? 100 : 0;
```

## Goal

Record `score` proportional to `part.marks` so accuracy reflects true performance.

## Steps

1. In `src/hooks/use-exam-session.ts` `handleSubmit`, change the returned `score` to reflect marks:
   - `const marks = typeof item.part.marks === "number" ? item.part.marks : 1;`
   - `score: correct ? marks : 0,`
     (Keeps `maxScore` derivation in `exam.ts` correct: for a correct N-mark part, `score=N, maxScore=N` → 100%.)
2. Confirm `exam.ts:29` `maxScore = part.marks ?? score` still works (it does; when `score` now equals marks for correct, maxScore=marks → accuracy 100%).
3. Verify `track-result.ts` is unchanged (its `score/maxScore` math is correct given correct inputs).
4. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/hooks/use-exam-session.ts` (the `score` assignment at line 136).
- Out of scope: multi-select correctness (plan 162), gamification XP (plan 170), visible exam percentage.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings on changed files.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run <new test>` → pass.

## Test plan

- Add/extend a test covering `processExamEffect` (see existing `src/lib/services/quiz-result-processor/__tests__/*` if present) or `use-exam-session` grading: build an `ExamPartResult` with `part.marks = 5, correct = true`, assert `trackQuestionResult` is called with `score === 5, maxScore === 5` (accuracy 100%). Mirror the assertion style of existing quiz-result-processor tests.

## Maintenance

- Combined with plan 162, exam grading now feeds competency correctly. Watch for any report that assumes `score` is 0/1 when consuming `ExamPartResult`.

## Escape hatches

- If `part.marks` is sometimes a non-numeric string (`ExamPartResult.part.marks?: number | string | null`), coerce with `Number(item.part.marks)` and guard `isFinite`. Keep fallback `1`.
