# Plan 134: Fix useQuizSession stale closure bug

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 6c00cdcd..HEAD -- src/hooks/use-quiz-session.ts`

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `6c00cdcd`, 2026-07-08

## Why this matters

`handleStop` reads `correctAnswers` from the render closure. When `handleNext` calls `handleStop()` on the last question (line 139), `setCorrectAnswers(x)` from the current question hasn't flushed yet — the final score reported to `onFinish` is off by -1. A `correctAnswersRef` already exists at line 84-85 but is never used.

## Current state

`src/hooks/use-quiz-session.ts:115-118`:

```ts
const handleStop = useCallback(() => {
  setIsRunning(false);
  onFinish?.({ correctAnswers, elapsedTime });
}, [onFinish, correctAnswers, elapsedTime]);
```

Line 84-85:

```ts
const correctAnswersRef = useRef(correctAnswers);
correctAnswersRef.current = correctAnswers;
```

The ref is updated but never read — `handleStop` uses the closure variable instead.

## Commands you will need

| Purpose   | Command                         | Expected on success |
| --------- | ------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`            | exit 0, no errors   |
| Tests     | `pnpm run test -- quiz-session` | all pass            |

## Steps

### Step 1: Fix `handleStop` to use ref instead of closure variable

Replace `correctAnswers` with `correctAnswersRef.current` and `elapsedTime` with a ref (or read the latest via ref pattern). Since `elapsedTime` is also captured from closure, create `elapsedTimeRef` too.

Add `const elapsedTimeRef = useRef(elapsedTime); elapsedTimeRef.current = elapsedTime;` after line 85.

Change `handleStop`:

```ts
const handleStop = useCallback(() => {
  setIsRunning(false);
  onFinish?.({ correctAnswers: correctAnswersRef.current, elapsedTime: elapsedTimeRef.current });
}, [onFinish]);
```

Remove `correctAnswers` and `elapsedTime` from the deps array — they're now read from refs.

**Verify**: `pnpm run typecheck` → 0 errors

### Step 2: Verify the fix doesn't break `handleNext` calling `handleStop`

Trace the flow in `handleNext`:

1. User answers question → `setCorrectAnswers(prev + 1)` schedules state update
2. If last question, `handleStop()` called
3. `handleStop` now reads `correctAnswersRef.current` which was already updated at line 85 during the same render cycle

This works because the ref is updated synchronously during render, before effects run.

**Verify**: Read through the code and confirm the ref update at line 85 fires before `handleStop` reads it.

### Step 3: Add a test if none exists

Check `src/hooks/__tests__/use-quiz-session.test.ts`. If it exists, add a test case that:

- Creates a session with 1 question
- "Answers" it correctly
- Verifies `onFinish` receives `correctAnswers: 1`

If no test file exists, create one at `src/hooks/__tests__/use-quiz-session.test.ts`.

**Verify**: `pnpm run test -- quiz-session` → all pass

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- quiz-session` exits 0 with at least 1 new passing test
- [ ] `handleStop` no longer depends on `correctAnswers` or `elapsedTime` in its deps array
- [ ] No files outside the in-scope list are modified

## STOP conditions

Stop and report if:

- `use-quiz-session.ts` has been significantly refactored since this plan was written
- The ref pattern doesn't match the existing code
