# Plan 223: Use useCallback with ref pattern for handleMCQSelect to stabilize dependency

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: perf

## Why this matters

This is a focused sub-fix extracted from Plan 219 — specifically targeting the `handleMCQSelect` callback which is the most frequently triggered callback in `QuestionCard`. Every time the user submits an answer, `state.isSubmitted` toggles, recreating `handleMCQSelect` with a new reference. Since this callback is passed to `MCQOptions` (which uses `React.memo`), the entire options grid re-renders on every submit toggle — even though the options haven't changed. On a quiz with 10+ questions and 4 options each, this means 10+ unnecessary re-renders of the full option grid per quiz session.

## Current state

- `src/components/quiz/parts/QuestionCard.tsx:224-230`:

```tsx
const handleMCQSelect = useCallback(
  (optionId: string) => {
    if (state.isSubmitted) return;
    setState((prev) => ({ ...prev, selectedOption: optionId }));
  },
  [state.isSubmitted],
);
```

`state.isSubmitted` changes on every submit → callback recreated → `MCQOptions` re-renders.

## Target state

- `handleMCQSelect` has an empty deps array `[]`
- `state.isSubmitted` is read from a ref, so the callback is created once and never changes
- `MCQOptions` memo comparison always passes (assuming other props are stable)

## Scope

- `src/components/quiz/parts/QuestionCard.tsx` — `handleMCQSelect` only

## Steps

### 1. Add ref for isSubmitted

In `src/components/quiz/parts/QuestionCard.tsx`, add after the existing state declarations:

```tsx
const isSubmittedRef = useRef(state.isSubmitted);
useEffect(() => {
  isSubmittedRef.current = state.isSubmitted;
}, [state.isSubmitted]);
```

### 2. Rewrite handleMCQSelect

Change the callback to read from ref:

```tsx
const handleMCQSelect = useCallback((optionId: string) => {
  if (isSubmittedRef.current) return;
  setState((prev) => ({ ...prev, selectedOption: optionId }));
}, []);
```

### 3. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Manually verify: load a quiz, select an option, submit answer. Confirm you cannot change selection after submit (the `isSubmittedRef.current` guard). Start a new question — selection works again.

## Stop conditions

- User can still select options after submitting (ref isn't reading updated value)
- MCQ selection feels delayed or doesn't register on first tap
- TypeScript errors with `useRef`/`useEffect` imports

## Estimated time

20 min
