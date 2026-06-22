# Plan 005: Add tests for quiz-result-processor

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/services/quiz-result-processor.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

`quiz-result-processor.ts` is a 463-line orchestrator that dispatches quiz completion across 4 sources (bolt, quiz, exam, flashcard), wiring wrong-answer tracking, flashcard auto-creation, competency tracking, study session scheduling, and analytics enqueueing. Every quiz completion, exam submission, flashcard review, and daily bolt finish flows through this processor. Zero test coverage means a regression in wrong-answer tracking or flashcard creation would silently break the spaced-repetition learning loop — the core product feature.

## Current state

**`src/lib/services/quiz-result-processor.ts`**: 463 lines, single `processQuizResult()` function with a discriminated union input (`bolt | quiz | exam | flashcard`). Each branch wires different deps:

- `processBolt`: tracks wrong answers, creates flashcards for incorrect, enqueues analytics
- `processQuiz`: accuracy calculation, batch flashcard creation, study session scheduling, analytics
- `processExam`: multi-part handling, marks resolution, wrong answer tracking
- `processFlashcard`: SM-2 review vs new card creation, quality threshold for scheduling

**`QuizResultDeps` interface**: All dependencies injected via a single deps object (DI pattern). This makes testing straightforward — create mock deps, call the function, assert on mock calls.

**Test convention**: Tests live in `__tests__/` subdirectories next to the source. Use vitest with `describe`/`test`/`expect`. Mock dependencies via manual mocks or `vi.fn()`. See `src/lib/question-engine/__tests__/` for pattern examples.

## Commands you will need

| Purpose   | Command                                                                    | Expected on success |
| --------- | -------------------------------------------------------------------------- | ------------------- |
| Typecheck | `npx tsc --noEmit`                                                         | exit 0, no errors   |
| Lint      | `npx biome check src/lib/services/__tests__/quiz-result-processor.test.ts` | 0 errors            |
| Tests     | `bun run test -- quiz-result-processor`                                    | all new tests pass  |

## Scope

**In scope**:

- `src/lib/services/__tests__/quiz-result-processor.test.ts` (create)

**Out of scope**:

- `src/lib/services/quiz-result-processor.ts` — do not modify the source
- Other service files

## Git workflow

- Branch: `advisor/005-quiz-processor-tests`
- Commit: `test: add test coverage for quiz-result-processor`

## Steps

### Step 1: Read the full source to understand the deps interface

Read `src/lib/services/quiz-result-processor.ts` fully. Identify the `QuizResultDeps` interface and all methods it exposes. These are what you'll mock.

### Step 2: Create the test file

Create `src/lib/services/__tests__/quiz-result-processor.test.ts` with:

```typescript
import { describe, test, expect, vi, beforeEach } from "vitest";
import { processQuizResult } from "../quiz-result-processor";
import type { QuizResultDeps } from "../quiz-result-processor";

function makeMockDeps(): QuizResultDeps {
  return {
    // Mock all methods from the deps interface
    // Use vi.fn() for each
    // Return appropriate defaults
  };
}

describe("processQuizResult", () => {
  let deps: QuizResultDeps;

  beforeEach(() => {
    deps = makeMockDeps();
  });

  describe("bolt source", () => {
    test("tracks wrong answers for incorrect responses", async () => {
      // Arrange: bolt result with some incorrect answers
      // Act: call processQuizResult with bolt source
      // Assert: deps.trackWrongAnswer called for each incorrect
    });

    test("creates flashcards for incorrect answers", async () => {
      // Assert: deps.createFlashcard called with correct args
    });

    test("enqueues analytics event", async () => {
      // Assert: deps.enqueueAnalytics called
    });
  });

  describe("quiz source", () => {
    test("calculates accuracy correctly", async () => {
      // 3 correct out of 5 = 60%
    });

    test("batch creates flashcards for wrong answers", async () => {
      // Assert: deps.createFlashcardsBatch called
    });

    test("schedules study session for review", async () => {
      // Assert: deps.scheduleStudySession called
    });
  });

  describe("exam source", () => {
    test("handles multi-part questions", async () => {
      // Assert: exam-specific logic
    });

    test("resolves marks correctly", async () => {
      // Assert: marks calculation
    });
  });

  describe("flashcard source", () => {
    test("SM-2 review for existing cards", async () => {
      // Assert: deps.reviewFlashcard called
    });

    test("creates new card when quality below threshold", async () => {
      // Assert: deps.createFlashcard called
    });
  });
});
```

### Step 3: Implement each test case

Read the source file carefully and implement each test. The key pattern:

1. Create mock deps with `vi.fn()` for every method
2. Call `processQuizResult(result, deps)` with appropriate input
3. Assert that the correct deps methods were called with correct arguments
4. Assert that incorrect deps methods were NOT called

### Step 4: Run the tests

```bash
bun run test -- quiz-result-processor
```

All tests must pass. If a test fails, read the error carefully and fix the mock or assertion — do NOT modify the source file.

## Test plan

- 12-15 test cases covering:
  - Each of the 4 sources (bolt, quiz, exam, flashcard)
  - Correct vs incorrect answer paths for each
  - Flashcard creation for wrong answers
  - Analytics enqueueing
  - Edge cases: empty results, all correct, all incorrect

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/services/__tests__/quiz-result-processor.test.ts` exits 0
- [ ] `bun run test -- quiz-result-processor` exits 0 with 12+ passing tests
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `QuizResultDeps` interface is not exported (you can't import it for typing mocks).
- The `processQuizResult` function signature doesn't match the discriminated union pattern described.
- More than 3 tests fail after reasonable mock fixes.

## Maintenance notes

- When new deps are added to `QuizResultDeps`, add corresponding mocks and tests.
- The mock factory `makeMockDeps()` should be updated whenever the interface changes.
- These tests use vitest, matching the repo's test framework.
