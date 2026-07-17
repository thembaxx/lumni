# Plan 247: Add integration test for full generate→grade→store→competency pipeline

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P1
- **Effort**: L
- **Risk**: MEDIUM
- **Depends on**: none
- **Category**: test
- **Generated at**: 2026-07-17

## Why this matters

The question lifecycle — generate → grade → store result → update competency → insert retention recurrence — is the core learning loop of the app. It spans 4 modules (`QuestionEngine`, `Grader`, `CompetencyService`, `RetentionService`) and at least one Appwrite/Dexie write. Every test today mocks at least one of these steps. The `learning-orchestrator.test.ts` mocks `QuestionEngine.generate()`. The `grade.test.ts` mocks the grader. No test validates that the full pipeline works together — including the data flow from a graded answer to competency score updates to wrong-answer recurrence scheduling.

A regression in any of these modules (e.g., competency score no longer written, retention recurrence not inserted for wrong answers) would go undetected until someone notices the "Practice Mistakes" page is empty or competency charts show no data.

## Current state

- `src/lib/question-engine/__tests__/learning-orchestrator.test.ts` — mocks `QuestionEngine.generate()`, tests orchestrator routing but not real engine output
- `src/app/api/engine/__tests__/grade.test.ts` — mocks grader, tests HTTP wrapping only
- `src/lib/question-engine/__tests__/question-engine.test.ts` — tests generation only, no grade→store wiring
- `src/lib/competency/__tests__/competency-service.test.ts` — tests CRUD but not integration with question engine
- `InMemoryDataAccess` exists and is used in other integration tests — works for this purpose

## Target state

`src/lib/question-engine/__tests__/pipeline.test.ts` that:

1. Seeds a cached MCQ question via `InMemoryDataAccess`
2. Loads it through the question engine pool
3. Grades a correct answer → verifies competency written with increased score
4. Grades an incorrect answer → verifies competency written with decreased score
5. Grades an incorrect answer → verifies retention recurrence inserted
6. Grades a partially correct answer → verifies proportional score update

Uses real `Grader`, `CompetencyService`, and `RetentionService` instances backed by `InMemoryDataAccess`. Depends on Plan 244 (deterministic `now`) for exact interval assertions.

## Scope

- `src/lib/question-engine/__tests__/pipeline.test.ts` (new, ~100-150 lines)
- No production code changes unless a bug is found during testing

## Steps

### 1. Read the existing deps and types

Read the following files to understand constructor signatures and data shapes:

```bash
cat src/lib/grader/index.ts
cat src/lib/competency/service.ts
cat src/lib/competency/types.ts
cat src/lib/retention/service.ts
cat src/lib/retention/types.ts
cat src/lib/question-engine/learning-orchestrator.ts
```

### 2. Create pipeline test file

Create `src/lib/question-engine/__tests__/pipeline.test.ts`:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import { Grader } from "@/lib/grader";
import { CompetencyService } from "@/lib/competency/service";
import { RetentionService } from "@/lib/retention/service";

describe("generate → grade → store → competency pipeline", () => {
  let db: InMemoryDataAccess;
  let grader: Grader;
  let competencyService: CompetencyService;
  let retentionService: RetentionService;

  beforeEach(() => {
    db = new InMemoryDataAccess();
    grader = new Grader();
    competencyService = new CompetencyService({ db });
    retentionService = new RetentionService({ db });
  });

  describe("correct MCQ answer", () => {
    it("stores correct answer, updates competency, does not create retention recurrence", async () => {
      // Seed a question via DataAccess
      const questionId = "q_test_1";
      await db.questions.create({
        id: questionId,
        type: "multiple-choice",
        subjectId: "mathematics",
        topic: "algebra",
        question: "What is 2+2?",
        options: [
          { id: "a", text: "3", isCorrect: false },
          { id: "b", text: "4", isCorrect: true },
          { id: "c", text: "5", isCorrect: false },
          { id: "d", text: "6", isCorrect: false },
        ],
        points: 1,
        difficulty: "Easy",
        createdAt: Date.now(),
      });

      // Grade the answer
      const gradeResult = await grader.grade({
        questionId,
        answer: { optionId: "b" },
        question: {
          options: [
            { id: "a", text: "3", isCorrect: false },
            { id: "b", text: "4", isCorrect: true },
            { id: "c", text: "5", isCorrect: false },
            { id: "d", text: "6", isCorrect: false },
          ],
        },
      });

      expect(gradeResult.isCorrect).toBe(true);

      // Store result via competency service
      const now = Date.now();
      await competencyService.trackQuestionResult({
        userId: "u_test",
        subjectId: "mathematics",
        topic: "algebra",
        questionId,
        correct: true,
        timestamp: now,
      });

      // Verify competency was written
      const competency = await db.competencies.get("u_test:mathematics:algebra");
      expect(competency).not.toBeNull();
      expect(competency!.score).toBeGreaterThan(0);

      // Verify no retention recurrence for correct answer
      const recurrences = await db.retentionRecurrence
        .where("questionId")
        .equals(questionId)
        .toArray();
      expect(recurrences.length).toBe(0);
    });
  });

  describe("incorrect answer", () => {
    it("stores incorrect answer, updates competency down, creates retention recurrence", async () => {
      const questionId = "q_test_2";
      await db.questions.create({
        id: questionId,
        type: "multiple-choice",
        subjectId: "mathematics",
        topic: "algebra",
        question: "What is 2+2?",
        options: [
          { id: "a", text: "3", isCorrect: false },
          { id: "b", text: "4", isCorrect: true },
          { id: "c", text: "5", isCorrect: false },
          { id: "d", text: "6", isCorrect: false },
        ],
        points: 1,
        difficulty: "Easy",
        createdAt: Date.now(),
      });

      // Grade incorrect answer
      const gradeResult = await grader.grade({
        questionId,
        answer: { optionId: "a" },
        question: {
          options: [
            { id: "a", text: "3", isCorrect: false },
            { id: "b", text: "4", isCorrect: true },
            { id: "c", text: "5", isCorrect: false },
            { id: "d", text: "6", isCorrect: false },
          ],
        },
      });

      expect(gradeResult.isCorrect).toBe(false);

      // Store result
      const now = Date.now();
      await competencyService.trackQuestionResult({
        userId: "u_test",
        subjectId: "mathematics",
        topic: "algebra",
        questionId,
        correct: false,
        timestamp: now,
      });

      // Verify competency was updated (score should decrease or be low)
      const competency = await db.competencies.get("u_test:mathematics:algebra");
      expect(competency).not.toBeNull();

      // Verify retention recurrence was created for wrong answer
      const recurrences = await db.retentionRecurrence
        .where("questionId")
        .equals(questionId)
        .toArray();
      expect(recurrences.length).toBeGreaterThan(0);
      expect(recurrences[0].scheduledDate).toBeGreaterThan(0);
    });
  });
});
```

Adjust the `grade()` call signature to match the actual `Grader` API. The key is using real implementations (not mocks) backed by `InMemoryDataAccess`.

### 3. Verify

```bash
pnpm test -- src/lib/question-engine/__tests__/pipeline.test.ts
pnpm run typecheck
pnpm exec biome check src/lib/question-engine/__tests__/pipeline.test.ts
```

## Test plan

| Scenario                           | Grade Answer             | Expected Competency           | Expected Retention                  |
| ---------------------------------- | ------------------------ | ----------------------------- | ----------------------------------- |
| Correct MCQ                        | Correct option           | Score increases               | No recurrence                       |
| Incorrect MCQ                      | Wrong option             | Score decreases               | Recurrence inserted                 |
| Correct on low-starting competency | Correct after 2 failures | Score increases from baseline | Previous recurrence cleared         |
| Multiple graded sessions           | 3 correct, 1 incorrect   | Score reflects ratio          | Only 1 recurrence for the wrong one |

## Done criteria

- [ ] `pnpm test -- src/lib/question-engine/__tests__/pipeline.test.ts` passes
- [ ] Tests use real `Grader`, `CompetencyService`, `RetentionService` with `InMemoryDataAccess`
- [ ] Pipeline validates: grade → write → competency update → retention recurrence
- [ ] No production code changes (unless bug found)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec biome check` passes on new file
- [ ] `plans/README.md` status row updated

## STOP conditions

- If any of the 3 modules (`Grader`, `CompetencyService`, `RetentionService`) have constructor requirements that can't be satisfied by `InMemoryDataAccess` (e.g., they require a real Dexie instance for compound queries), stop and assess — the integration test may need real Dexie with `offlineDB` seeding instead
- If the `Grader` requires AI provider to be initialized (it shouldn't for MCQ, but confirm), skip AI-dependent question types and test only rule-based grading
- If `trackQuestionResult` writes to multiple Dexie tables in a transaction that `InMemoryDataAccess` doesn't support, the approach needs revision

## Estimated time

3-4 hours
