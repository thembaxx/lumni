# Plan 141: Fix quiz FINISH dispatch race with RECORD_ANSWER

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/quiz-session/use-quiz-session.ts src/components/quiz/hooks/use-quiz-view.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: MED | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

When the user answers the last question and proceeds, `handleNext()` dispatches `FINISH` before `RECORD_ANSWER` settles. The `correctness` array and `correctAnswers` count in the `QuizCompleteResult` are out of date — the last question's result is excluded. This corrupts quiz results, analytics, and flashcard creation for the final question of every quiz.

## Current state

`src/lib/quiz-session/use-quiz-session.ts:121-127`:

```typescript
next() {
  if (currentIndex < questions.length - 1) {
    dispatch({ type: "SET_INDEX", payload: currentIndex + 1 });
  } else {
    dispatch({ type: "FINISH" });  // FINISH fires before last RECORD_ANSWER
  }
}
```

`src/components/quiz/hooks/use-quiz-view.ts:94-108`:

```typescript
const handleNext = () => {
  const s = stateRef.current;
  // ...check if answer is recorded...
  actions.next();  // Dispatches FINISH for last question
  // reads s.correctness — still missing last answer
  onCompleteRef.current?.({ correctness: s.correctness, ... });
};
```

The `recordAnswer` function is called separately (e.g., when user selects an option or presses submit), then `next` is called. Between these two calls, the last answer may not have been processed by the reducer.

## Steps

### Step 1: Ensure RECORD_ANSWER settles before FINISH

In `use-quiz-view.ts`, modify `handleNext` so that for the last question, `recordAnswer` is called first and awaited (or the answer is passed as part of the FINISH action).

**Option A (preferred)**: Pass the final answer in the `FINISH` action payload:

Extend the `FINISH` action to accept an optional `finalAnswer`:

```typescript
// In the reducer
case "FINISH": {
  const correctness = action.payload.finalAnswer
    ? [...state.correctness, action.payload.finalAnswer]
    : state.correctness;
  // ...
}
```

In `use-quiz-view.ts`:

```typescript
const handleNext = () => {
  const s = stateRef.current;
  if (s.currentIndex === s.questions.length - 1 && lastAnswerRef.current) {
    actions.next(lastAnswerRef.current); // Pass final answer with FINISH
  } else {
    actions.next();
  }
};
```

**Option B (simpler)**: In `handleNext`, call `recordAnswer` synchronously before `next`:

```typescript
const handleNext = () => {
  // For the last question, ensure the answer is recorded first
  if (stateRef.current.currentIndex === stateRef.current.questions.length - 1) {
    const answer = getCurrentAnswer();
    if (answer) actions.recordAnswer(answer);
  }
  actions.next();
};
```

Read the existing code to determine which approach fits best with the existing reducer action types.

### Step 2: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass. `pnpm exec oxlint` → exit 0.

## Test plan

Add a test to the quiz reducer test suite (or the use-quiz-view tests) that:

1. Creates a quiz with 1 question
2. Records an answer
3. Dispatches FINISH
4. Verifies the completeness result includes the last answer's correctness

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` exits 0
- [ ] The last question's answer is included in the `QuizCompleteResult.correctness` array
- [ ] The `correctAnswers` count includes the last question

## STOP conditions

Stop and report if:

- The quiz reducer action types have been restructured.
- `use-quiz-view.ts` has been significantly refactored since the plan was written.
