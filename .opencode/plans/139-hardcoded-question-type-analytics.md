# Plan 139: Thread real questionType through exam/flashcard analytics events

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/services/quiz-result-processor/exam.ts src/lib/services/quiz-result-processor/flashcard.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: MED | **Depends on**: none | **Category**: bug
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

Both `exam.ts` and `flashcard.ts` hardcode `questionType: "multiple-choice"` for all analytics events, regardless of actual question type. 100% of exam and flashcard analytics events are mislabeled, making question-type-specific metrics useless for the analytics pipeline.

## Current state

`src/lib/services/quiz-result-processor/exam.ts:85`:

```typescript
deps.enqueue("analytics-sync", {
  events: parts.map((r) => ({
    event: "grade",
    timestamp: Date.now(),
    subject,
    questionType: "multiple-choice" as QuestionType, // ALWAYS hardcoded
    success: r.correct,
    duration: 0,
  })),
});
```

`src/lib/services/quiz-result-processor/flashcard.ts:71`:

```typescript
deps.enqueue("analytics-sync", {
  events: cards.map((card) => ({
    event: "grade",
    timestamp: Date.now(),
    subject,
    questionType: "multiple-choice" as QuestionType, // ALWAYS hardcoded
    success: (qualities.get(card.id) ?? 0) >= 3,
    duration: 0,
  })),
});
```

## Commands you will need

| Purpose   | Command            | Expected on success |
| --------- | ------------------ | ------------------- |
| Typecheck | `pnpm typecheck`   | exit 0, no errors   |
| Tests     | `pnpm test`        | all pass            |
| Lint      | `pnpm exec oxlint` | exit 0              |

## Scope

**In scope**:

- `src/lib/services/quiz-result-processor/exam.ts`
- `src/lib/services/quiz-result-processor/flashcard.ts`

**Out of scope**: Analytics pipeline infrastructure, other quiz-result-processor files.

## Steps

### Step 1: Fix exam.ts

In `src/lib/services/quiz-result-processor/exam.ts`, the `parts` array contains `ExamPartResult` objects. Each part likely has a `.type` field (e.g., `"multiple-choice"`, `"calculation"`, `"essay"`). Read the `ExamPartResult` type to find the type field name.

Replace:

```typescript
questionType: "multiple-choice" as QuestionType,
```

with:

```typescript
questionType: (r.type ?? "multiple-choice") as QuestionType,
```

If `r.type` doesn't exist, read the `ExamPartResult` type from the imports or the processor's type definitions. The field name might be `partType`, `questionType`, or similar.

### Step 2: Fix flashcard.ts

In `src/lib/services/quiz-result-processor/flashcard.ts`, flashcards don't have the same concept of question types since they're user-generated. Use `"flashcard"` as the type instead of `"multiple-choice"`:

```typescript
questionType: "flashcard" as QuestionType,
```

This requires that `"flashcard"` is a valid value in the `QuestionType` union. If not, check the `QuestionType` type definition at `src/lib/question-engine/types.ts` or the shared types barrel. If `"flashcard"` is not in the union, don't add it — instead use a type that signals "not a real question type" like `"mixed"`.

### Step 3: Verify

`pnpm typecheck` → exit 0. `pnpm test -- quiz-result-processor` → all pass.

## Test plan

Update the existing quiz-result-processor tests to verify the `questionType` field in the emitted analytics events matches the source data, not a hardcoded value.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test -- quiz-result-processor` passes
- [ ] `grep "multiple-choice" src/lib/services/quiz-result-processor/exam.ts` returns no matches
- [ ] `grep "multiple-choice" src/lib/services/quiz-result-processor/flashcard.ts` returns no matches

## STOP conditions

Stop and report if:

- `ExamPartResult` doesn't have a type field that maps to the question type.
- `QuestionType` union doesn't accept the replacement value.
