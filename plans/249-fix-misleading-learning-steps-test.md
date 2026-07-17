# Plan 249: Fix misleading test name and clarify advanceLearningStep behavior

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (but adjacent to Plan 244 — if 244 changes `advanceLearningStep` signature, apply after 244)
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

A test named "stays graduated if called when already at -1" asserts the opposite of what it actually verifies. It calls `advanceLearningStep(-1, 4)` and asserts `step === 0` and `delay === 1` — meaning a graduated card (step -1) gets re-enrolled into learning step 0 when reviewed. This is either a bug (graduated cards should stay graduated) or the test name is wrong (should be "re-enrolls graduated card when reviewed"). Misleading test names obscure real bugs — a future refactorer might read the name, trust it, and break actual behavior.

The session context (Session 1, flashcard engine fix) suggests graduated cards being re-enrolled IS the intended behavior (cards with wrong answers restart learning steps), but the test name contradicts it.

## Current state

- `src/lib/flashcard-engine/__tests__/learning-steps.test.ts:63-67`:

```ts
it("stays graduated if called when already at -1", () => {
  const result = advanceLearningStep(-1, 4);
  expect(result.step).toBe(0);
  expect(result.delay).toBe(1);
});
```

Test body asserts step goes from -1 to 0 (re-enrollment), but test name says "stays graduated".

## Target state

**Option A** (if re-enrollment is intentional): Rename test to accurately describe re-enrollment behavior.

```ts
it("re-enrolls graduated card when reviewed at good quality", () => {
  const result = advanceLearningStep(-1, 4);
  expect(result.step).toBe(0);
  expect(result.delay).toBe(1);
});
```

**Option B** (if staying graduated is intended): Fix `advanceLearningStep` implementation to return `{ step: -1, delay: 0 }` when `currentStep === -1`.

## Scope

- `src/lib/flashcard-engine/__tests__/learning-steps.test.ts` — rename test
- `src/lib/flashcard-engine/learning-steps.ts` — only if Option B (implementation fix)

## Steps

### 1. Read learning-steps.ts

Read the full implementation of `advanceLearningStep` to understand whether returning step 0 from -1 is intentional.

```bash
cat src/lib/flashcard-engine/learning-steps.ts
```

### 2. Read learning-steps.test.ts

Read the full test file for context on how other step transitions work.

```bash
cat src/lib/flashcard-engine/__tests__/learning-steps.test.ts
```

### 3. Determine Option A or B

- Review any callers that pass `-1` and expect re-enrollment behavior
- Review the SM-2 algorithm to see if it expects `-1` to mean "graduated and can be re-enrolled on re-review"
- If re-enrollment is intentional → Option A (rename test)
- If graduated should be permanent → Option B (fix implementation)

### 4A (if Option A): Rename test

```ts
it("re-enrolls graduated card into learning step 0 when reviewed", () => {
  const result = advanceLearningStep(-1, 4);
  expect(result.step).toBe(0);
  expect(result.delay).toBe(1);
});
```

Also add a clarifying comment explaining that cards with wrong answers need to restart their learning steps:

```ts
// Note: step -1 means "graduated" (card has completed learning steps).
// When a graduated card is reviewed again (e.g., wrong answer elsewhere triggers re-review),
// it re-enters learning at step 0. This is intentional — the card needs re-learning.
```

### 4B (if Option B): Fix implementation

In `learning-steps.ts`:

```ts
export function advanceLearningStep(
  currentStep: number,
  quality: number,
  now: number = Date.now(),
): { step: number; delay: number } {
  // A graduated card stays graduated regardless of review quality
  if (currentStep < 0) {
    return { step: -1, delay: 0 };
  }
  // ... rest of function
}
```

### 5. Verify

```bash
pnpm test -- src/lib/flashcard-engine/__tests__/learning-steps.test.ts
pnpm run typecheck
pnpm exec biome check src/lib/flashcard-engine/__tests__/learning-steps.test.ts
```

## Test plan

| Before                                               | After                                                                |
| ---------------------------------------------------- | -------------------------------------------------------------------- |
| `it("stays graduated if called when already at -1")` | `it("re-enrolls graduated card into learning step 0 when reviewed")` |
| Asserts step=0, delay=1 (contradicts name)           | Same assertion, accurate name                                        |

## Done criteria

- [ ] Test name accurately describes the behavior
- [ ] If Option B: graduated cards stay graduated permanently
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm test` passes with no regressions
- [ ] `pnpm exec biome check` passes on changed files
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the ambiguity cannot be resolved by reading the code alone (e.g., usage is mixed and no one on the team knows the intent), stop and file a question — do not guess
- If more than one test has a misleading name in this file, fix all of them in this plan, not just the -1 case

## Estimated time

30-60 minutes
