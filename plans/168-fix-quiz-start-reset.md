# Plan 168: Fix Quiz `START` Action Unconditionally Resetting State

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/quiz-session/reducer.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: HIGH
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The `START` action in `quizReducer` unconditionally resets to initial state. If any code path dispatches `START` while a quiz is in progress (e.g., useEffect re-fires because `questions` identity changes), the reducer wipes all progress: `correctAnswers`, `userAnswers`, `currentIndex`, `elapsedTime`. The user sees a fresh quiz UI with 0 answered — their current card is gone. Mid-quiz progress loss is a severe UX failure for a study app.

## Current state

In `src/lib/quiz-session/reducer.ts`, line ~51:

```typescript
case "START":
  return { ...INITIAL_QUIZ_STATE, isActive: true };
```

In `useQuizSession` (likely `src/hooks/use-quiz-session.ts` or `src/lib/quiz/use-quiz-session.ts`), the `start()` callback checks localStorage but does NOT check `quizState.isActive` before dispatching `START`.

## Commands you will need

| Purpose   | Command                                        | Expected on success |
| --------- | ---------------------------------------------- | ------------------- |
| Install   | `pnpm install`                                 | exit 0              |
| Typecheck | `pnpm run typecheck`                           | exit 0, no errors   |
| Tests     | `pnpm run test -- --run src/lib/quiz-session/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                       | exit 0              |

## Scope

**In scope**:

- `src/lib/quiz-session/reducer.ts`

**Out of scope**:

- The caller that dispatches `START` (separate fix if needed)
- Other reducer actions

## Steps

### Step 1: Add guard to `START` case

In `src/lib/quiz-session/reducer.ts`, modify the `START` case:

```typescript
case "START":
  // Don't reset an active, incomplete quiz
  if (state.isActive && !state.isComplete) {
    return state;
  }
  return { ...INITIAL_QUIZ_STATE, isActive: true };
```

**Verify**: `pnpm run test -- --run src/lib/quiz-session/reducer.test.ts` → all pass

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/quiz-session/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Add test cases to the reducer test file:

1. `START` on already-active quiz → returns unchanged state
2. `START` on completed quiz → returns initial state (allows restart)
3. `START` on inactive quiz → returns active initial state (existing behavior)

Use the existing reducer test file as the pattern.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/quiz-session/` exits 0; new test cases exist for the guard
- [ ] `START` on active+incomplete quiz returns current state unchanged
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The reducer structure differs from the excerpt
- The state type doesn't have an `isComplete` field — use whatever indicates quiz completion
- Test file doesn't exist at expected path

## Maintenance notes

The guard prevents progress loss but may mask the root cause (incorrect `START` dispatch). Future work should audit why `START` is double-dispatched and fix the caller. Reviewers should verify the guard doesn't prevent legitimate restarts (when `isComplete` is true).
