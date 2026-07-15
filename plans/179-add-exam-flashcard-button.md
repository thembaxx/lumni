# Plan 179: Add "Create Flashcards from Wrong Answers" Button to Exam Results

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/components/exam/session-results-view.tsx`
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

Exam auto-creates flashcards during processing, but there's no on-demand "study these" button on the results screen. Students who want to immediately study their missed questions as flashcards must navigate to the flashcard page separately and hope the auto-creation has completed. An explicit button improves the exam-to-flashcard learn loop.

## Current state

Auto-creation happens in `quiz-result-processor/exam.ts:23-36` during processing. The results screen (`session-results-view.tsx`) has "Review Mistakes" and "Share Result" but no flashcard-related action.

The flashcard engine's `createBatch()` or equivalent method exists — check `src/lib/flashcard-engine/engine.ts` for the appropriate method to call.

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/components/exam/session-results-view.tsx` — add a button

**Out of scope**:

- The flashcard engine itself
- The auto-creation logic during processing

## Steps

### Step 1: Add "Study missed questions" button

In `src/components/exam/session-results-view.tsx`, add a button below "Review Mistakes" that navigates to a flashcard session seeded with the exam's wrong answers. Use the existing button styling from the same file.

The link should go to `/flashcards?mode=exam-review&sessionId={sessionId}` or similar — check if the flashcard page already supports a `sessionId` query parameter. If not, use a simpler approach: navigate to `/flashcards` with a query that triggers flashcard generation from the exam session's wrong answers.

**Verify**: `rg "Study missed" src/components/exam/session-results-view.tsx` → 1 match

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

No new tests needed. Pure UI addition following existing patterns.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] "Study missed questions" button appears on exam results view
- [ ] Button navigates to appropriate flashcard session
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The session results view doesn't have access to the list of wrong-answer question IDs
- `/flashcards` route doesn't support an exam-review mode parameter — report and we'll scope it differently

## Maintenance notes

The button is complementary to the auto-creation flow. If the auto-creation already created flashcards by the time the user clicks, the flashcard page should show them immediately. If not, the click should trigger batch creation.
