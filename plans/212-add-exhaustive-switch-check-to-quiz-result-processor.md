# Plan 212: Add exhaustive switch check to quiz-result-processor

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: bug

## Why this matters

Three switch statements over the `input.source` discriminant in `quiz-result-processor/index.ts` have no `default:` arm. When a new source variant is added (e.g. `"story"`, `"lesson"`, `"challenge"`), these switches silently return `undefined` — the code compiles, typechecks, and deploys with zero warning. The missing variant causes silent data loss: webhook payloads with `subject: undefined`, score extractors returning `undefined` that downstream code treats as a number, and Effect pipelines that return `Effect.void` (the Effect equivalent of `undefined`). An `assertUnreachable()` default arm catches new variants at compile time with a friendly error message.

## Current state

Three switches in `src/lib/services/quiz-result-processor/index.ts`:

**Switch 1 — `extractSubject()` (lines 26-35)**:

```ts
function extractSubject(input: QuizResultInput): string | undefined {
  switch (input.source) {
    case "bolt":
      return input.question.question.subject;
    case "quiz":
      return input.results.questions[0]?.subject;
    case "exam":
      return input.subject;
    case "flashcard":
      return input.subject;
  }
  // missing default → returns undefined silently
}
```

**Switch 2 — `extractScore()` (lines 38-52)**:

```ts
function extractScore(input: QuizResultInput): { score: number; total: number } | undefined {
  switch (input.source) {
    case "bolt":
      return { score: input.question.correct ? 1 : 0, total: 1 };
    case "quiz":
      return { score: input.results.correctAnswers, total: input.results.totalQuestions };
    case "exam": {
      const total = input.parts.length;
      const correct = input.parts.filter((p) => p.correct).length;
      return { score: correct, total };
    }
    case "flashcard":
      return undefined;
  }
  // missing default → returns undefined silently
}
```

**Switch 3 — `processQuizResultEffect()` (lines 67-81)**:

```ts
function processQuizResultEffect(
  input: QuizResultInput,
  deps: QuizResultDeps,
): Effect.Effect<void> {
  switch (input.source) {
    case "bolt":
      return processBoltEffect(input.question, deps);
    case "quiz":
      return processQuizEffect(input.results, deps);
    case "exam":
      return processExamEffect(input.parts, input.subject, input.paperId, deps);
    case "flashcard":
      return processFlashcardEffect(input.cards, input.qualities, input.subject, input.isSm2, deps);
  }
  // missing default → returns undefined, Effect.runPromise(undefined) crashes
}
```

## Target state

All 3 switches get a `default:` arm with `assertUnreachable(input.source)`. Create an `assertUnreachable` helper in the same file or import from a shared location:

```ts
function assertUnreachable(x: never, message?: string): never {
  throw new Error(message ?? `Unreachable case: ${JSON.stringify(x)}`);
}
```

Then:

```ts
switch (input.source) {
  case "bolt": ...
  case "quiz": ...
  case "exam": ...
  case "flashcard": ...
  default:
    assertUnreachable(input.source, `Unknown quiz result source: ${input.source}`);
}
```

This forces the compiler to verify that every variant of the `Source` discriminant type is handled. When a new variant is added, the switch produces a type error pointing directly to the gap.

## Scope

- `src/lib/services/quiz-result-processor/index.ts` only
- Add `assertUnreachable` helper (can be in same file since it's small)
- No other files

## Steps

### 1. Add `assertUnreachable` helper

Add near the top of `src/lib/services/quiz-result-processor/index.ts`:

```ts
function assertUnreachable(x: never, message?: string): never {
  throw new Error(message ?? `Unreachable case: ${JSON.stringify(x)}`);
}
```

### 2. Add `default:` to `extractSubject` switch

After case `"flashcard"`: add `default: assertUnreachable(input.source, "Unknown source in extractSubject")`.

### 3. Add `default:` to `extractScore` switch

After case `"flashcard"`: add `default: assertUnreachable(input.source, "Unknown source in extractScore")`.

### 4. Add `default:` to `processQuizResultEffect` switch

After case `"flashcard"`: add `default: return assertUnreachable(input.source, "Unknown source in processQuizResultEffect")`.

### 5. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Expected: zero errors. All existing tests pass because no new variant has been added — the `default` is unreachable today.

## Stop conditions

- Any file outside `src/lib/services/quiz-result-processor/index.ts` is modified — stop and revert
- `pnpm run typecheck` fails
- More than 1 test regresses

## Estimated time

20-30 minutes
