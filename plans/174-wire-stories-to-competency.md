# Plan 174: Wire Stories Comprehension Results to Competency Engine

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/app/[locale]/stories/[storyId]/story-reader-client/`
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

Story comprehension questions are graded and displayed to the user, but scores never reach the competency engine. Reading comprehension practice across English, Afrikaans, and isiZulu is invisible to topic-proficiency calculations. The "weakest topic" recommendation and study planner miss this practice data. The integration is trivial — the hook to `trackQuestionResult()` already exists.

## Current state

In `src/app/[locale]/stories/[storyId]/story-reader-client/index.tsx`, the `handleGraded` callback (~line 365-378) collects scores and shows them in a results card. There's no call to `CompetencyService.trackQuestionResult()`.

Pattern to follow: `src/lib/services/quiz-result-processor/bolt.ts:20-26` calls `deps.trackQuestionResult(...)` with `{ subjectId, topicId, score, maxScore }`.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/app/[locale]/stories/[storyId]/story-reader-client/index.tsx`

**Out of scope**:

- Other story components
- The competency service

## Steps

### Step 1: Add competency tracking in `handleGraded`

In the story reader's `handleGraded` callback, after a comprehension question is graded, add:

```typescript
import { competencyService } from "@/lib/services";

// Inside handleGraded, after grading
await competencyService.trackQuestionResult({
  subjectId: story.language, // or the language from story metadata
  topicId: `reading-${story.id}`, // or use the story's title/topic
  score: isCorrect ? 1 : 0,
  maxScore: 1,
  type: "story-comprehension",
});
```

The exact fields (`subjectId`, `topicId`) depend on story metadata available in the component. Use whatever identifies the language (for subject) and the specific story or reading skill (for topic).

**Verify**: `rg "trackQuestionResult" src/app/[locale]/stories/` → 1+ match

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests should pass. No new tests needed for this simple integration call.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] Story comprehension results call `trackQuestionResult()` after grading
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The story reader component structure differs from the excerpt
- `handleGraded` callback doesn't exist or has a different signature
- `competencyService` import path is different

## Maintenance notes

This is an additive change — it doesn't affect existing story functionality. If `competencyService` is not available as a direct import in the story reader (it's likely a dependency), pass it as a prop or import the singleton.
