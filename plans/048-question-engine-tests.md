# Plan 048: Add characterization tests for QuestionEngine core

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/question-engine/question-engine.ts src/lib/question-engine/__tests__/`

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (tests are additive — no production code changes)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`QuestionEngine` (326 lines) is the core generator for every question in the app. It orchestrates caching strategy (Dexie → Appwrite → AI), enrichment pipeline, RAG context threading, pool question merging, mixed-type generation, grading, and hints. Its test file has only 2 tests covering `listTypes` and a basic `validate` call. The `generate()`, `grade()`, `hint()`, `generateMixed()`, and caching interactions are entirely untested — any refactor of this module is blind.

## Current state

`src/lib/question-engine/__tests__/question-engine.test.ts` has 2 tests (68 lines). No tests for:

- `generate()` with pool questions
- `generate()` with AI fallback
- `generateMixed()` type distribution
- `grade()` delegation to type-specific graders
- `hint()` delegation
- Caching strategy interactions
- RAG context fetching and threading
- Validation scoring per question type

The class accepts `RagDeps`, `CacheResolver`, `AIClient`, and `EnrichmentPipeline` via constructor DI — all injectable for tests.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/question-engine/__tests__/question-engine.test.ts` — extend with new tests

**Out of scope**:

- Any production code in `question-engine.ts`
- Integration tests requiring real AI or database
- Tests for individual question-type processors (those have their own test files)

## Steps

### Step 1: Add a factory helper for test setup

At the top of the test file (or in a new `question-engine.test.helpers.ts`), create minimal mock implementations:

```typescript
import type { AIClient } from "@/lib/ai";
import type { CacheResolver } from "@/lib/caching-strategy";
import type { EnrichmentPipeline } from "../enrichment-pipeline";
import type { Question, GenerateResult, GenerationParams } from "../types";
import { QuestionEngine } from "../question-engine";

function createMockEngine(options?: {
  ai?: AIClient;
  enrichment?: EnrichmentPipeline;
  caching?: CacheResolver<Question[], GenerationParams>;
}): QuestionEngine {
  return new QuestionEngine(undefined, options?.caching, options?.ai, options?.enrichment);
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Add test for generate() with pool questions

Test that `generate()` with pool questions returns them directly without AI call:

```typescript
test("generate returns pool questions without calling AI", async () => {
  const aiSpy = {
    generate: vi.fn().mockRejectedValue(new Error("should not be called")),
  } as unknown as AIClient;
  const caching = {
    resolve: vi.fn().mockImplementation((params: GenerationParams) => {
      // Bypass caching to reach generateInternal
      return null;
    }),
  } as unknown as CacheResolver<Question[], GenerationParams>;

  const engine = createMockEngine({ ai: aiSpy, caching });
  const result = await engine.generate({
    subject: "mathematics",
    topic: "algebra",
    count: 2,
    poolQuestions: [
      {
        id: "pq1",
        questionText: "What is 2+2?",
        answerText: "4",
        marks: 1,
        year: 2024,
        paperNumber: "1",
        type: "multiple-choice",
        bloomLevel: "remember",
        topic: "algebra",
      },
    ],
  });

  expect(result.questions).toHaveLength(1);
  expect(aiSpy.generate).not.toHaveBeenCalled();
});
```

**Verify**: `pnpm run test -- src/lib/question-engine/` → new test passes.

### Step 3: Add test for listTypes completeness

Replace the current generic test with one that validates all 11 types:

```typescript
test("listTypes returns all 11 registered types", () => {
  const engine = new QuestionEngine();
  const types = engine.listTypes();
  expect(types).toContain("multiple-choice");
  expect(types).toContain("matching");
  expect(types).toContain("short-answer");
  expect(types).toContain("long-answer");
  expect(types).toContain("essay");
  expect(types).toContain("calculation");
  expect(types).toContain("diagram");
  expect(types).toContain("programming");
  expect(types).toContain("source-based");
  expect(types).toContain("data-response");
  expect(types).toContain("mixed");
});
```

**Verify**: `pnpm run test -- src/lib/question-engine/` → passes.

### Step 4: Add test for validate scoring

Test that validate returns scores for different question types:

```typescript
test("validate returns high score for a well-formed multiple-choice question", () => {
  // Reuse the existing valid MCQ test
});

test("validate returns low score for empty question text", () => {
  // Reuse the existing empty-text test
});

test("validate returns low score for mismatched body type", () => {
  const engine = new QuestionEngine();
  const question = {
    id: "q-bad-body",
    type: "multiple-choice",
    // ... valid MCQ fields but missing body.options
    body: { incorrectField: true },
  } as unknown as Question;
  const result = engine.validate(question);
  expect(result.isValid).toBe(false);
  expect(result.score).toBeLessThan(50);
});
```

**Verify**: `pnpm run test -- src/lib/question-engine/` → passes.

### Step 5: Add test for grade delegation

Test that `grade()` calls the correct processor:

```typescript
test("grade delegates to the correct processor", async () => {
  const engine = new QuestionEngine();
  const question = {
    /* a valid MCQ question */
  } as Question;
  const answer = { selectedOptionId: "B" };
  const result = await engine.grade(question, answer);
  expect(result.isCorrect).toBeDefined();
  expect(result.feedback).toBeDefined();
});
```

**Verify**: `pnpm run test -- src/lib/question-engine/` → passes.

### Step 6: Run full test suite

```bash
pnpm run test
```

All tests should pass. If any existing test breaks, it's from a change to the test infrastructure (unlikely).

## Test plan

- Add 5-8 new tests covering: pool question generation, all 11 types in listTypes, validate scoring for multiple body types, grade delegation, hint delegation
- Follow the existing test pattern in the file (vitest `describe`/`test`/`expect`)

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0; at least 7 tests in `question-engine.test.ts` (up from 2)
- [ ] New tests cover: `generate()` with pool questions, all 11 types, validate scoring, grade delegation
- [ ] No production code files changed (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `QuestionEngine` constructor changed and no longer accepts the documented DI parameters
- A mock `AIClient.generate()` is called unexpectedly during pool-question test
- The grade/hint delegation test reveals missing processor registrations (report it — that's a separate finding)
