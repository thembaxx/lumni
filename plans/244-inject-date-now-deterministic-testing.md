# Plan 244: Inject Date.now() dependency in algorithms for deterministic testing

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

`Date.now()` is used directly in 29+ production sites. In tests, this produces non-deterministic results — the same test passing or failing depending on the millisecond it ran. The FSRS algorithm, learning steps, gamification engine, and risk model all compute intervals based on `now`, making any test that checks `interval`, `due`, or `delay` flaky.

The standard fix — `vi.setSystemTime()` in Vitest — patches the global `Date.now()` for the entire test file. But this is brittle when multiple suites run in parallel (Session 19's `mock.module` pollution lesson applies). A DI approach (`now?: number` defaulting to `Date.now()`) keeps each call deterministic without global state.

## Current state

- `src/lib/flashcard-engine/algorithms.ts:4` — `const now = Date.now()` used directly in `calculateNextReviewFSRS`
- `src/lib/flashcard-engine/learning-steps.ts:27` — `Date.now()` for delay calculation
- `src/lib/gamification-engine/*` — multiple `Date.now()` calls for streak/cooldown tracking
- `src/lib/analytics/risk-model.ts` — `Date.now()` for recency calculations
- `vi.setSystemTime` is usable in Vitest but doesn't help when tests run in parallel with other suites that expect real timestamps
- This is the reason FSRS and learning-steps tests cannot assert exact interval values today

## Target state

Key functions accept an optional `now?: number` parameter defaulting to `Date.now()`:

```ts
export function calculateNextReviewFSRS(
  card: FlashcardState,
  grade: number,
  now: number = Date.now(),
  params?: FSRSConfig,
): ReviewResult { ... }
```

Existing call sites (production) are unchanged — the default handles them. Tests pass explicit `now` values for deterministic assertions. `vi.setSystemTime` is also available for files that need to test multiple calls in the same timeline.

## Scope

### Must change

- `src/lib/flashcard-engine/algorithms.ts` — add `now?: number` to `calculateNextReviewFSRS`
- `src/lib/flashcard-engine/learning-steps.ts` — add `now?: number` to `advanceLearningStep`
- `src/lib/analytics/risk-model.ts` — add `now?: number` to `calculateRiskScore` and factor functions

### Must not change

- Gamification engine functions — these use `Date.now()` in broader state mutation contexts where DI is less clean; use `vi.setSystemTime` in their tests instead
- Any function where `now` is used in only one line and the test can use `vi.setSystemTime` without conflicts

## Steps

### 1. Audit all Date.now() call sites

Find all production uses:

```bash
rg "Date\.now\(\)" src/lib/ --include "*.ts" --include "*.tsx"
```

Identify the ones that are:

- Pure computations where `now` is a logical input (algorithms, risk model) → DI candidate
- Side-effect mutations where `now` is a timestamp for storage (gamification, sync) → `vi.setSystemTime` candidate
- UI components where `now` is for display (relative time, formatting) → leave as-is, test with `vi.setSystemTime`

### 2. Add optional `now` parameter to algorithms.ts

```ts
export function calculateNextReviewFSRS(
  card: FlashcardState,
  grade: number,
  now: number = Date.now(),
  params: FSRSConfig = initFSRS(),
): ReviewResult {
  // Replace direct Date.now() with the now param
}
```

### 3. Add optional `now` parameter to learning-steps.ts

```ts
export function advanceLearningStep(
  currentStep: number,
  quality: number,
  now: number = Date.now(),
): { step: number; delay: number } {
  // Replace direct Date.now() with the now param
}
```

### 4. Add optional `now` parameter to risk-model.ts

```ts
export function calculateRiskScore(data: UserRiskData | null, now: number = Date.now()): RiskScore {
  // Replace direct Date.now() with the now param
}
```

### 5. Update Plan 241 tests to pass explicit `now`

In `src/lib/flashcard-engine/__tests__/fsrs-algorithms.test.ts`, the tests for `calculateNextReviewFSRS` should pass a fixed `now` value and assert exact interval values:

```ts
const now = 1000000;
const result = calculateNextReviewFSRS(state, 5, now, params);
expect(result.interval).toBe(/* exact expected value */);
```

### 6. Update learning-steps tests

In `src/lib/flashcard-engine/__tests__/learning-steps.test.ts`, add tests that pass explicit `now`:

```ts
it("returns correct delay with explicit now", () => {
  const result = advanceLearningStep(0, 4, 1000);
  expect(result.delay).toBe(/* expected delay */);
});
```

### 7. Verify

```bash
pnpm test -- src/lib/flashcard-engine/__tests__/
pnpm test -- src/lib/analytics/__tests__/
pnpm run typecheck
pnpm exec biome check
```

## Test plan

Post-change, the following tests become deterministic:

| File                      | Before                        | After                             |
| ------------------------- | ----------------------------- | --------------------------------- |
| `fsrs-algorithms.test.ts` | Cannot assert exact intervals | Can assert exact intervals        |
| `learning-steps.test.ts`  | Tests depend on test timing   | Deterministic with explicit `now` |
| `risk-model.test.ts`      | Recency calculations flaky    | Deterministic with explicit `now` |

## Done criteria

- [ ] All 3 production files accept optional `now` parameter
- [ ] All existing call sites compile without changes (backward compatible)
- [ ] Plan 241 tests assert exact interval values
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm test` passes with no regressions
- [ ] `plans/README.md` status row updated

## STOP conditions

- If any function has more than 5 call sites and the added parameter would create 5-line diffs at each call site (check with `rg "calculateNextReviewFSRS"`), consider whether a config object parameter is cleaner
- If `now` is already available on the `FlashcardState` object (e.g., a `lastReviewed` field), the DI approach may be redundant — check the actual data shape first
- If a function is called from a class method that already has `this.now` as a class field, prefer the class field over parameter injection

## Estimated time

2-3 hours
