# Plan 219: Stabilize callback references in QuestionCard to restore React.memo effectiveness

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: perf

## Why this matters

`QuestionCard` passes callbacks (`setCalcValue`, `setCode`, `handleMCQSelect`, `handleMCQSubmit`) to `QuestionCardInput`, which has internal `React.memo` on `MCQOptions`. Because these callbacks are created as inline arrow functions or have unstable `useCallback` deps, every parent render recreates them — defeating the memoization and forcing `MCQOptions` (and its heavy option grid) to re-render on every keystroke or state change in unrelated parts of the card.

Fixing callback stability reduces unnecessary re-renders during quiz interactions, which is noticeable on slower devices and reduces React reconciliation cost.

## Current state

- `src/components/quiz/parts/QuestionCard.tsx:224-230` — `handleMCQSelect` depends on `state.isSubmitted`, recreated on every submit toggle
- `src/components/quiz/parts/QuestionCard.tsx:232-239` — `handleMCQSubmit` depends on `state.selectedOption`, `question`, `handleGrade`
- `src/components/quiz/parts/QuestionCard.tsx:293-298` — `setCalcValue` is an inline arrow function `(next) => { setState(...) }`
- `src/components/quiz/parts/QuestionCard.tsx:300-305` — `setCode` is an inline arrow function `(next) => { setState(...) }`
- All four are passed as props to `QuestionCardInput` which wraps `MCQOptions` in `React.memo`

## Target state

- `setCalcValue` and `setCode` wrapped in `useCallback` with stable `[]` deps (they only call `setState`)
- `handleMCQSelect` uses a `ref` for `isSubmitted` check so the callback has `[]` deps
- `handleMCQSubmit` deps narrowed: `question` and `handleGrade` already stable; `state.selectedOption` replaced by a ref

## Scope

- `src/components/quiz/parts/QuestionCard.tsx` — callback definitions only
- Do NOT change `QuestionCardInput.tsx` or `MCQOptions.tsx` — they already have `React.memo`

## Steps

### 1. Use ref for `isSubmitted` in `handleMCQSelect`

Add a `const isSubmittedRef = useRef(state.isSubmitted)` and update it via `useEffect` when `state.isSubmitted` changes. Then `handleMCQSelect` can depend on `[]`:

```ts
const isSubmittedRef = useRef(state.isSubmitted);
useEffect(() => {
  isSubmittedRef.current = state.isSubmitted;
}, [state.isSubmitted]);

const handleMCQSelect = useCallback((optionId: string) => {
  if (isSubmittedRef.current) return;
  setState((prev) => ({ ...prev, selectedOption: optionId }));
}, []);
```

### 2. Wrap `setCalcValue` and `setCode` in `useCallback`

```ts
const setCalcValue = useCallback(
  (next: React.SetStateAction<string>) =>
    setState((prev) => ({
      ...prev,
      calcValue: typeof next === "function" ? next(prev.calcValue) : next,
    })),
  [],
);

const setCode = useCallback(
  (next: React.SetStateAction<string>) =>
    setState((prev) => ({
      ...prev,
      code: typeof next === "function" ? next(prev.code) : next,
    })),
  [],
);
```

### 3. Narrow `handleMCQSubmit` deps

`question` and `handleGrade` are already stable refs (question comes from props, grade is useCallback with stable deps). `state.selectedOption` can be read from a ref. Use the same ref pattern:

```ts
const selectedOptionRef = useRef(state.selectedOption);
useEffect(() => {
  selectedOptionRef.current = state.selectedOption;
}, [state.selectedOption]);

const handleMCQSubmit = useCallback(() => {
  if (!selectedOptionRef.current || question.type !== "multiple-choice") return;
  const body = question.body as Question<"multiple-choice">["body"];
  const opts = body?.options ?? [];
  const selectedOpt = opts.find((opt) => opt.id === selectedOptionRef.current);
  if (!selectedOpt) return;
  handleGrade({ type: "option-ids", value: [selectedOpt.id] });
}, [question, handleGrade]);
```

### 4. Update props passed to QuestionCardInput

Replace the inline `setCalcValue` and `setCode` props with the new `useCallback`-wrapped references (lines 293-305). The names stay the same — just the value changes.

### 5. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

## Stop conditions

- Quiz MCQ selection breaks (selected option doesn't highlight)
- Code input or calc input stops updating on keystroke
- Submit button doesn't trigger grading

## Estimated time

1–2 hours
