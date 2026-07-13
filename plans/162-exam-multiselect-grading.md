---
status: TODO
priority: P1
effort: S
risk: LOW
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 162 — Exam multi-select MCQ graded as single-select

## Context

Exam parts whose `options` array contains more than one `isCorrect: true` (multi-correct / "select all that apply") are graded incorrectly. The grading code only checks the **first** selected option, and the "correct answer" text only reports the first correct option. The data model already supports multi-value answers (`getAnswerText` joins arrays), so this is a real defect wherever exam content uses multi-correct parts.

## Current state (verified)

`src/hooks/use-exam-session.ts:129-131`

```ts
if (item.part.type === "multiple-choice" && item.part.options) {
  const selected = Array.isArray(answer?.value) ? answer?.value[0] : answer?.value;
  correct = item.part.options.some((o) => o.id === selected && o.isCorrect);
}
```

`src/lib/exam/helpers.ts:13-19`

```ts
export function getCorrectAnswerText(part: QuestionPart): string {
  if (part.options) {
    const correct = part.options.find((o) => o.isCorrect);
    return correct ? `${correct.id}. ${correct.text}` : "";
  }
  return "";
}
```

The question-engine MCQ grader already does exact-membership matching (`src/lib/question-engine/processors/graders/mcq.ts`) — align exam grading with that convention.

## Goal

Grade multi-correct MCQ parts by exact set membership (selected ids == correct ids) and report all correct options in `correctAnswerText`.

## Steps

1. Read `src/types/exam-paper.ts` to confirm `QuestionPart.options` shape (`{ id, text, isCorrect }[]`) and that `marks` is on the part.
2. In `src/hooks/use-exam-session.ts` `handleSubmit`, replace the multiple-choice branch:
   - `const selectedIds = Array.isArray(answer?.value) ? answer.value : answer?.value != null ? [answer.value] : [];`
   - `const correctIds = item.part.options.filter((o) => o.isCorrect).map((o) => o.id);`
   - `correct = selectedIds.length === correctIds.length && selectedIds.every((id) => correctIds.includes(id));`
3. In `src/lib/exam/helpers.ts` `getCorrectAnswerText`, join **all** correct options:
   - `const correct = part.options.filter((o) => o.isCorrect);`
   - return `correct.map((o) => `${o.id}. ${o.text}`).join("; ")` (or `""` when none).
4. Confirm `getAnswerText` already joins arrays (`helpers.ts:27`) — leave as-is.
5. Run `pnpm exec oxfmt --check` after edits (formatter is strict).

## Scope

- In scope: `src/hooks/use-exam-session.ts`, `src/lib/exam/helpers.ts`.
- Out of scope: the `score` vs `part.marks` issue (see plan 163), competency feed, wrong-answer capture (uses `correctAnswerText` which this plan fixes).

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings on changed files.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run <new test path>` → pass.

## Test plan

- Find existing exam-session grading test (search `src/hooks/__tests__/use-exam-session*` or `src/**/*exam*test*`). If present, add a case with a 2-correct-option part where the user selects both → asserts `correct === true`; selecting only one → `correct === false`; `getCorrectAnswerText` returns both labels.
- If no such test exists, create `src/lib/exam/__tests__/helpers.test.ts` (happy-dom not required) covering `getCorrectAnswerText` with 1 vs 2 correct options and `getAnswerText` with array values, mirroring the style of other `src/lib/**/__tests__/*.test.ts` files.

## Maintenance

- Any future multi-correct exam content now grades correctly. Keep exam grading semantics identical to `mcq.ts` grader to avoid divergence.

## Escape hatches

- If `QuestionPart.options` cannot carry more than one `isCorrect` in the actual paper schema, the fix is still safe for single-correct (exact-match with one correct id). Implement as specified; no regression expected.
