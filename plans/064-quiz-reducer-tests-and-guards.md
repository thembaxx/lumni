# Plan 064: Add characterization tests + invariant guards to quiz reducer

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P0
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

The quiz session reducer is the state machine at the heart of every quiz and mock exam. It handles `START_SESSION`, `ANSWER_QUESTION`, `NEXT_QUESTION`, `FINISH_SESSION`, and `TICK_TIMER` actions. It has zero tests. Additionally, the reducer does not guard against `RECORD_ANSWER` dispatches after `FINISH`, allowing the `correctness` and `userAnswers` arrays to grow silently. A regression here breaks every quiz and mock exam.

## Current state

`src/lib/quiz-session/reducer.ts` — pure reducer, ~50 lines:

```typescript
// Lines 38-44 — RECORD_ANSWER case has no isComplete guard:
case "RECORD_ANSWER": {
  return {
    ...state,
    correctness: [...state.correctness, action.payload.correct],
    userAnswers: [...state.userAnswers, action.payload.answer],
  };
}
```

No `__tests__/` directory exists under `src/lib/quiz-session/`.

## Repo conventions

- Test files go in `__tests__/` next to the module, or as `*.test.ts`.
- Tests use vitest with happy-dom environment (see `vitest.config.ts`).
- Follow the pattern from `src/lib/quiz-session/__tests__/use-quiz-session.test.tsx` if one exists, or use `src/lib/competency-engine/__tests__/` as a pattern for reducer tests.
- Use `describe`/`it`/`expect` from vitest (globals not injected — import `describe`, `it`, `expect` from `vitest`).

## Scope

**In scope**:

- `src/lib/quiz-session/reducer.ts` — add guard, no other changes
- `src/lib/quiz-session/__tests__/reducer.test.ts` — create

**Out of scope**:

- `src/lib/quiz-session/use-quiz-session.ts` — hook tests
- Any change to action types or state shape

## Commands

| Purpose   | Command                                 | Expected on success |
| --------- | --------------------------------------- | ------------------- |
| Tests     | `pnpm run test -- src/lib/quiz-session` | all pass            |
| Typecheck | `pnpm run typecheck`                    | exit 0              |
| Lint      | `pnpm exec oxlint --fix`                | exit 0              |

## Steps

### Step 1: Add `isComplete` guard to `RECORD_ANSWER` case

In `src/lib/quiz-session/reducer.ts`, add at the top of the `RECORD_ANSWER` case:

```typescript
case "RECORD_ANSWER":
  if (state.isComplete) return state;
  // existing logic follows...
```

**Verify**: Read the file to confirm the guard is in place.

### Step 2: Create test file

Create `src/lib/quiz-session/__tests__/reducer.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { quizSessionReducer, initialState } from "../reducer";

describe("quizSessionReducer", () => {
  it("handles START_SESSION and sets subject + questions", () => {
    const state = quizSessionReducer(initialState, {
      type: "START_SESSION",
      payload: { subject: "mathematics", questions: [{ id: "q1" }], totalQuestions: 1 },
    });
    expect(state.isComplete).toBe(false);
    expect(state.subject).toBe("mathematics");
    expect(state.questions).toHaveLength(1);
  });

  it("handles RECORD_ANSWER and appends correctness", () => {
    const started = quizSessionReducer(initialState, {
      type: "START_SESSION",
      payload: { subject: "math", questions: [{ id: "q1" }], totalQuestions: 1 },
    });
    const state = quizSessionReducer(started, {
      type: "RECORD_ANSWER",
      payload: { questionId: "q1", correct: true, answer: { value: "42" } },
    });
    expect(state.correctness).toEqual([true]);
    expect(state.userAnswers).toHaveLength(1);
  });

  it("guards RECORD_ANSWER after FINISH — returns same state", () => {
    const started = quizSessionReducer(initialState, {
      type: "START_SESSION",
      payload: { subject: "math", questions: [{ id: "q1" }], totalQuestions: 1 },
    });
    const finished = quizSessionReducer(started, { type: "FINISH" });
    const again = quizSessionReducer(finished, {
      type: "RECORD_ANSWER",
      payload: { questionId: "q1", correct: true, answer: { value: "42" } },
    });
    expect(again).toBe(finished); // Same reference — no mutation
  });

  it("handles FINISH and sets isComplete", () => {
    const started = quizSessionReducer(initialState, {
      type: "START_SESSION",
      payload: { subject: "math", questions: [], totalQuestions: 0 },
    });
    const state = quizSessionReducer(started, { type: "FINISH" });
    expect(state.isComplete).toBe(true);
  });

  it("handles NEXT_QUESTION", () => {
    const started = quizSessionReducer(initialState, {
      type: "START_SESSION",
      payload: { subject: "math", questions: [{ id: "q1" }, { id: "q2" }], totalQuestions: 2 },
    });
    const next = quizSessionReducer(started, { type: "NEXT_QUESTION" });
    expect(next.currentIndex).toBe(1);
  });

  it("handles TICK_TIMER", () => {
    const started = quizSessionReducer(initialState, {
      type: "START_SESSION",
      payload: { subject: "math", questions: [], totalQuestions: 0 },
    });
    const ticked = quizSessionReducer(started, { type: "TICK_TIMER" });
    expect(ticked.timeRemaining).toBe(initialState.timeRemaining - 1);
  });
});
```

Adjust import paths (`quizSessionReducer`, `initialState`) to match the actual exports from `reducer.ts`. Read the file first — it may export differently than shown here.

**Verify**: `pnpm run test -- src/lib/quiz-session` → all 6+ tests pass.

## Done criteria

- [ ] `pnpm run test -- src/lib/quiz-session` exits 0 with all tests passing
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If the reducer is not a pure function (has side effects) — stop and report. The test approach assumes a pure reducer with no internal state.
- If `initialState` is not exported from the reducer file — check if the default state is defined inline. You may need to export it first, which is still in scope.

## Maintenance notes

- The guard in `RECORD_ANSWER` uses referential equality (`state` is the previous state) — the test uses `toBe` to verify the same object is returned.
- If new action types are added to the reducer, they should be added to this test file.
- The `initialState` export location should be confirmed by reading the file before writing tests.
