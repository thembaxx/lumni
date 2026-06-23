# Plan 056: Extract inline mapPoolToQuestion into standalone adapter

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first: `git diff --stat 7525d6ed..HEAD -- src/lib/question-engine/`

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (pure extraction — no logic changes)
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`mapPoolToQuestion()` is a 50-line inline function inside `QuestionEngine.generateInternal()` that converts past-paper pool questions into `Question` objects. It has a branching chain for 3 question types (`multiple-choice`, `calculation`, `short-answer`), creating placeholder values (`Number.NaN`, `"None of the above"`, empty strings) for each. This logic belongs outside the AI generation engine — adding a new pool-question-supported type means editing the engine's production code.

## Current state

`src/lib/question-engine/question-engine.ts:109-165` — inside `generateInternal()`:

```typescript
const mapPoolToQuestion = (
  pq: NonNullable<GenerationParams["poolQuestions"]>[number],
): Question => {
  const qType = (pq.type as QuestionType) ?? "short-answer";
  const bloom = (pq.bloomLevel as BloomLevel) ?? "understand";

  let body: QuestionBody[typeof qType];
  if (qType === "multiple-choice") {
    body = {
      options: [
        { id: "a", text: pq.answerText, isCorrect: true },
        { id: "b", text: "None of the above", isCorrect: false },
      ],
      correctOptionId: "a",
      allowMultiple: false,
    } as QuestionBody["multiple-choice"];
  } else if (qType === "calculation") {
    body = {
      formula: "",
      correctValue: Number.NaN,
      unit: "",
      tolerance: 0,
    } as QuestionBody["calculation"];
  } else {
    body = {
      modelAnswer: pq.answerText,
      acceptableAnswers: [pq.answerText],
      maxLength: 500,
    } as QuestionBody["short-answer"];
  }
  // ... rest of mapping
};
```

The repo follows a single-class-per-file convention for services (see `PushDeliveryService`, `GamificationService`).

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- Create `src/lib/question-engine/pool-question-adapter.ts`
- Modify `src/lib/question-engine/question-engine.ts`

**Out of scope**:

- Changes to the `Question` type or `QuestionBody` types
- The enrichment pipeline or `GenerationParams` type
- Test files (the adapter will be tested through existing engine tests)

## Steps

### Step 1: Create pool-question-adapter.ts

```typescript
import type { BloomLevel, Question, QuestionBody, QuestionType } from "./types";
import type { GenerationParams } from "./types";

type PoolQuestion = NonNullable<GenerationParams["poolQuestions"]>[number];

export function mapPoolToQuestion(pq: PoolQuestion, subject: string, topic?: string): Question {
  const qType = (pq.type as QuestionType) ?? "short-answer";
  const bloom = (pq.bloomLevel as BloomLevel) ?? "understand";

  let body: QuestionBody[typeof qType];
  if (qType === "multiple-choice") {
    body = {
      options: [
        { id: "a", text: pq.answerText, isCorrect: true },
        { id: "b", text: "None of the above", isCorrect: false },
      ],
      correctOptionId: "a",
      allowMultiple: false,
    } as QuestionBody["multiple-choice"];
  } else if (qType === "calculation") {
    body = {
      formula: "",
      correctValue: Number.NaN,
      unit: "",
      tolerance: 0,
    } as QuestionBody["calculation"];
  } else {
    body = {
      modelAnswer: pq.answerText,
      acceptableAnswers: [pq.answerText],
      maxLength: 500,
    } as QuestionBody["short-answer"];
  }

  return {
    id: pq.id,
    type: qType,
    subject,
    topic: pq.topic ?? topic ?? "",
    difficulty: "Medium" as const,
    bloomTaxonomy: bloom,
    points: pq.marks,
    questionText: pq.questionText,
    hint: "",
    explanation: `From ${pq.year} Paper ${pq.paperNumber}`,
    body,
    metadata: {
      createdAt: Date.now(),
      source: "imported",
    },
    webSources: [
      {
        title: `${subject} ${pq.year} Paper ${pq.paperNumber}`,
        url: "#",
      },
    ],
    sourcePaperId: pq.id,
    sourcePastPaperQuestionId: pq.id,
  };
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 2: Import adapter in question-engine.ts

Add the import:

```typescript
import { mapPoolToQuestion } from "./pool-question-adapter";
```

Remove the inline `mapPoolToQuestion` function from `generateInternal()` (lines 109-165).

Replace the calls:

```typescript
// BEFORE (line 168):
return poolQuestions.map(mapPoolToQuestion);

// AFTER:
return poolQuestions.map((pq) => mapPoolToQuestion(pq, enriched.subject, enriched.topic));

// BEFORE (line 194):
const directQuestions: Question[] = poolQuestions.map(mapPoolToQuestion);

// AFTER:
const directQuestions: Question[] = poolQuestions.map((pq) =>
  mapPoolToQuestion(pq, enriched.subject, enriched.topic),
);
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Run verification

```bash
pnpm run typecheck && pnpm run test
```

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `src/lib/question-engine/pool-question-adapter.ts` exists with the extracted function
- [ ] `question-engine.ts` no longer contains the inline `mapPoolToQuestion` function
- [ ] No logic changes — only extraction
- [ ] `plans/README.md` status row updated

## Maintenance notes

- Adding a new pool-question-supported type now means editing `pool-question-adapter.ts`, not `question-engine.ts`.
- The `Number.NaN` in calculation body is a known smell from the original code. If it ever causes issues, fix it in the adapter in isolation.
- Consider adding a test for the adapter in a future plan.
