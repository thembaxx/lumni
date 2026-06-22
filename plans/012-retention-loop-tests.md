# Plan 012: Add tests for retention-loop next-action

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/retention-loop/next-action.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

`resolveNextAction()` implements a 6-branch priority chain (due-cards > review-mistakes > weakest-topic > flashcards > study-plan > null) that powers the "Next Best Action" dashboard card — the primary user engagement driver. A bug in priority ordering or dismissal timing would surface wrong or stale suggestions to every user daily. Zero test coverage.

## Current state

**`src/lib/retention-loop/next-action.ts:71-144`**: `resolveNextAction()` reads from multiple data sources (Dexie tables + localStorage) and implements a 6-branch priority chain. Uses module-level `_deps` and reads `localStorage` directly.

**Test convention**: Tests in `__tests__/` subdirectories. Use vitest. InMemoryDataAccess for Dexie mocking. `vi.useFakeTimers()` for time-dependent tests.

## Commands you will need

| Purpose   | Command                                                                | Expected on success |
| --------- | ---------------------------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                                     | exit 0, no errors   |
| Lint      | `npx biome check src/lib/retention-loop/__tests__/next-action.test.ts` | 0 errors            |
| Tests     | `bun run test -- next-action`                                          | all new tests pass  |

## Scope

**In scope**:

- `src/lib/retention-loop/__tests__/next-action.test.ts` (create)

**Out of scope**:

- `src/lib/retention-loop/next-action.ts` — do not modify the source
- Other retention-loop files

## Git workflow

- Branch: `advisor/012-retention-tests`
- Commit: `test: add test coverage for retention-loop next-action`

## Steps

### Step 1: Read the full source

Read `src/lib/retention-loop/next-action.ts` fully. Identify:

- The `_deps` interface and `__setDepsForTesting()` function
- All 6 priority branches
- `localStorage` usage (exam_dates, dismissals)
- `getTimeOfDay()` dependency on `Date`

### Step 2: Create the test file

Create `src/lib/retention-loop/__tests__/next-action.test.ts`:

```typescript
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { resolveNextAction } from "../next-action";
import { __setDepsForTesting } from "../next-action";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";

describe("resolveNextAction", () => {
  let db: InMemoryDataAccess;

  beforeEach(() => {
    vi.useFakeTimers();
    db = new InMemoryDataAccess();
    __setDepsForTesting({ db });
    // Mock localStorage
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test("returns due flashcards when available", async () => {
    // Seed db with due flashcards
    // Call resolveNextAction(userId)
    // Assert result is due-cards action
  });

  test("returns review-mistakes when no due cards", async () => {
    // No flashcards in db, seed wrongAnswers with retention entries
    // Assert result is review-mistakes action
  });

  test("returns weakest-topic when no review-mistakes", async () => {
    // Seed competencies with varying scores
    // Assert result is weakest-topic
  });

  test("returns flashcards-only when no competencies", async () => {
    // Empty db except flashcards (not due)
    // Assert result is flashcards action
  });

  test("returns study-plan in evening", async () => {
    vi.setSystemTime(new Date("2026-06-21T19:00:00"));
    // Seed study plan
    // Assert result is study-plan action
  });

  test("returns null when all dismissed", async () => {
    // Mock localStorage to return dismissal for all actions
    // Assert result is null
  });

  test("respects dismissal cooldown", async () => {
    // Mock localStorage with recent dismissal
    // Assert that dismissed action is skipped
  });
});
```

### Step 3: Implement each test

Read the source carefully. Use `InMemoryDataAccess` seeded via `seed()` for Dexie data. Mock `localStorage` for exam_dates and dismissals. Use `vi.setSystemTime()` for time-of-day tests.

### Step 4: Run the tests

```bash
bun run test -- next-action
```

All tests must pass. Do NOT modify the source file.

## Test plan

- 7-10 test cases covering:
  - Each of the 6 priority branches
  - Dismissal logic
  - Time-of-day dependency
  - Empty state (null return)

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/retention-loop/__tests__/next-action.test.ts` exits 0
- [ ] `bun run test -- next-action` exits 0 with 7+ passing tests
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- `__setDepsForTesting` is not exported from `next-action.ts`.
- The `_deps` interface is not compatible with `InMemoryDataAccess`.
- More than 3 tests fail after reasonable mock fixes.

## Maintenance notes

- `getTimeOfDay()` reads `new Date()` — always use `vi.setSystemTime()` in tests.
- localStorage mocking must be reset between tests to avoid state leakage.
