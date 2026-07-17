# Plan 241: Add FSRS algorithm unit tests — zero coverage on 4 exported functions

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: HIGH
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

The FSRS (Free Spaced Repetition Schedule) algorithm is the core of flashcard scheduling. It computes next review intervals using `Math.exp()`, exponentiation (`S ** -W[12]`), and division by constants — all sources of NaN/Infinity on edge inputs. A single silent NaN in `calculateNextReviewFSRS` means cards never appear for review again (infinite interval) or appear every second (zero interval). Despite this, none of the 4 exported functions have a single test. This plan covers quality grades 0-5, reset paths, ease-hell recovery boundaries, and leech detection thresholds.

## Current state

- `src/lib/flashcard-engine/algorithms.ts:65-174` — `initFSRS`, `calculateNextReviewFSRS`, `checkEaseHellRecovery`, `checkLeech` are exported but never imported in any test file
- `calculateNextReviewFSRS` contains `Math.exp(W[7] * S ** -W[12])` — exponentiation on `S` (stability) with a negative exponent creates division-by-zero risk when `S` is 0
- `checkEaseHellRecovery` compares `currentEase` against `easeThreshold` with no guard for NaN/Infinity
- `checkLeech` counts consecutive "pass then fail" patterns with no lower bound on `consecutivePass` or `consecutiveFail`

## Target state

All 4 exported functions have 6-8 focused test cases covering:

- `initFSRS`: returns correct params shape, values within expected ranges
- `calculateNextReviewFSRS`: quality == 0 (complete reset), quality 1-2 (< 3 reset path), quality 3-5 (>= 3 stability path), edge case S=0 doesn't produce NaN
- `checkEaseHellRecovery`: below threshold triggers recovery, above threshold returns null, undefined inputs return null
- `checkLeech`: below threshold returns false, at threshold returns true, above threshold returns true, alreadyLeeched=true skips check, null/undefined inputs return false

## Scope

- `src/lib/flashcard-engine/__tests__/fsrs-algorithms.test.ts` (new)
- No changes to production code unless a bug is found

## Steps

### 1. Create test file and core function imports

Create `src/lib/flashcard-engine/__tests__/fsrs-algorithms.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  initFSRS,
  calculateNextReviewFSRS,
  checkEaseHellRecovery,
  checkLeech,
} from "../algorithms";
```

### 2. `initFSRS` tests

```ts
describe("initFSRS", () => {
  it("returns default params with expected keys", () => {
    const p = initFSRS();
    expect(p).toHaveProperty("requestRetention");
    expect(p).toHaveProperty("maximumInterval");
    expect(p).toHaveProperty("w");
    expect(Array.isArray(p.w)).toBe(true);
    expect(p.w.length).toBeGreaterThan(0);
  });
});
```

### 3. `calculateNextReviewFSRS` tests — quality paths

Test the 3 quality paths:

- **Quality 0** (`grade < 1`): `againDelay` path — should reset stability, return short interval
- **Quality 1-2** (`grade < 3`): reset path — shorter intervals, difficulty may increase
- **Quality 3-5** (`grade >= 3`): stability path — longer intervals based on stability

Edge cases:

- `grade` is 0, 1, 2, 3, 4, 5 (all valid grades)
- Return value has `interval`, `stability`, `difficulty` fields
- `interval` is non-negative finite number
- `stability` is non-negative finite number

```ts
describe("calculateNextReviewFSRS", () => {
  const params = initFSRS();
  const now = Date.now();
  const baseState = { stability: 5, difficulty: 5, due: now - 86400000 };

  it.each([0, 1, 2, 3, 4, 5])("handles grade %i without NaN", (grade) => {
    const result = calculateNextReviewFSRS(baseState, grade, now, params);
    expect(result).toHaveProperty("interval");
    expect(result).toHaveProperty("stability");
    expect(result).toHaveProperty("difficulty");
    expect(Number.isFinite(result.interval)).toBe(true);
    expect(Number.isFinite(result.stability)).toBe(true);
    expect(Number.isFinite(result.difficulty)).toBe(true);
  });

  it("resets stability on grade 0", () => {
    const result = calculateNextReviewFSRS(baseState, 0, now, params);
    expect(result.stability).toBeLessThan(2);
  });

  it("increases stability on grade 5", () => {
    const result = calculateNextReviewFSRS(baseState, 5, now + 86400000, params);
    expect(result.stability).toBeGreaterThanOrEqual(baseState.stability);
  });
});
```

### 4. `checkEaseHellRecovery` tests

```ts
describe("checkEaseHellRecovery", () => {
  it("returns recovery action when currentEase is below threshold", () => {
    const result = checkEaseHellRecovery(1.5, { easeThreshold: 2.0 });
    expect(result).not.toBeNull();
    if (result) {
      expect(result.action).toBe("recover");
    }
  });

  it("returns null when currentEase is above threshold", () => {
    const result = checkEaseHellRecovery(2.5, { easeThreshold: 2.0 });
    expect(result).toBeNull();
  });

  it("returns null for undefined/null values", () => {
    expect(checkEaseHellRecovery(undefined as any, { easeThreshold: 2.0 })).toBeNull();
    expect(checkEaseHellRecovery(1.5, undefined as any)).toBeNull();
  });
});
```

### 5. `checkLeech` tests

```ts
describe("checkLeech", () => {
  const now = Date.now();
  const card = {
    id: "fc_1",
    ease: 2.5,
    interval: 1,
    due: now - 1,
    consecutivePass: 0,
    consecutiveFail: 0,
    leeched: false,
  };

  it("returns false when consecutivePass is below leech threshold", () => {
    expect(checkLeech({ ...card, consecutivePass: 3 }, { leechThreshold: 8 })).toBe(false);
  });

  it("returns true when consecutivePass is at threshold", () => {
    expect(checkLeech({ ...card, consecutivePass: 8 }, { leechThreshold: 8 })).toBe(true);
  });

  it("returns true when already leeched", () => {
    expect(checkLeech({ ...card, consecutivePass: 0, leeched: true }, { leechThreshold: 8 })).toBe(
      true,
    );
  });

  it("returns false for null/undefined card input safely", () => {
    expect(checkLeech(null as any, { leechThreshold: 8 })).toBe(false);
    expect(checkLeech(undefined as any, { leechThreshold: 8 })).toBe(false);
  });
});
```

### 6. Verify

```bash
pnpm test -- src/lib/flashcard-engine/__tests__/fsrs-algorithms.test.ts
pnpm run typecheck
pnpm exec biome check src/lib/flashcard-engine/__tests__/fsrs-algorithms.test.ts
```

## Test plan

The test file itself is the test plan. 6-8 cases covering:

1. `initFSRS` shape and types
2. Grade 0 (again) — reset path
3. Grade 1-2 — reset path
4. Grade 3-5 — stability path
5. Edge: S=0 doesn't produce NaN
6. `checkEaseHellRecovery` below/above/undefined
7. `checkLeech` below/at/above threshold, already leeched
8. `checkLeech` null/undefined inputs

## Done criteria

- [ ] `pnpm test -- src/lib/flashcard-engine/__tests__/fsrs-algorithms.test.ts` passes (6-8 tests)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on the new file
- [ ] `plans/README.md` status row updated

## STOP conditions

- If `calculateNextReviewFSRS` produces NaN/Infinity for any valid grade (0-5), stop and report the bug — this is a production issue that needs fixing in the algorithm, not just the test
- If `initFSRS()` is not a pure function and has side effects (e.g., reads from localStorage), the testing approach must change — read the implementation first
- If the function signatures don't match the above test code (e.g., different params), adjust tests to match reality

## Estimated time

2-3 hours
