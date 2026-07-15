# Plan 173: Wire Pronunciation Scoring to Competency Tracking

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

Pronunciation practice scores are saved to `pronunciationHistory` Dexie table but never fed into the competency engine. Students practicing subject-specific vocabulary pronunciation get no competency credit. The "weakest topic" detection, study planner's inverse-competency scheduling, and next-best-action card all miss pronunciation effort entirely. This is a cheap integration — the `CompetencyService.trackQuestionResult()` call already exists and is used by quizzes, exams, and flashcards.

## Current state

In `recording-orchestrator.ts`, `transcribeAndAssess()` (~line 104-112) calls `savePronunciationScore()` which writes to `pronunciationHistory`. There is zero calls to `CompetencyService.trackQuestionResult()` in any pronunciation file.

The pattern to follow: in `src/lib/services/quiz-result-processor/bolt.ts:20-26`, after processing a result, it calls `deps.trackQuestionResult(...)` with `{ subjectId, topicId, score, maxScore }`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/pronunciation/pronunciation-client/recording-orchestrator.ts`

**Out of scope**:

- The competency service itself
- Other pronunciation components

## Steps

### Step 1: Add `trackQuestionResult` call after score save

In `recording-orchestrator.ts`, after `savePronunciationScore(...)` completes, add a call to `CompetencyService.trackQuestionResult()`:

```typescript
// After savePronunciationScore
import { competencyService } from "@/lib/services"; // or the correct import path

if (overallScore != null) {
  await competencyService.trackQuestionResult({
    subjectId: "languages", // or the language being practiced
    topicId: word, // the word being practiced
    score: overallScore >= 70 ? 1 : 0,
    maxScore: 1,
    type: "pronunciation",
  });
}
```

Adjust the `subjectId` and `topicId` based on how the pronunciation client knows which language/subject the user is practicing. If it's not available in the current scope, add it as a parameter to `transcribeAndAssess()`.

**Verify**: `rg "trackQuestionResult" src/app/[locale]/pronunciation/` → 1+ match

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

No new tests needed for this integration. The competency service already has its own tests. If `competencyService` is not mockable in the pronunciation tests, use dependency injection (pass as a parameter).

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Pronunciation scoring calls `trackQuestionResult()` after saving
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The recording orchestrator structure differs from the excerpt
- `competencyService` import path is different (correct it based on the codebase)
- The subject/language context is not available — in that case, add it as a parameter

## Maintenance notes

Pronunciation competency feeds into the same system as quiz/flashcard/exam competency. This means pronunciation practice affects the study planner's topic weighting, which is correct behavior (students who practice pronunciation of a language should see that reflected in their recommendations).
