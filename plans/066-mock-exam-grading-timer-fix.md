# Plan 066: Fix mock exam non-MCQ grading + timer safety

> **Executor instructions**: Follow this plan step by step. Run every verification command — do not move on until it passes. If anything in STOP conditions occurs, stop and report.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: 064 (creates quiz reducer tests — run 064 first if you also need the guard fix)
- **Category**: bug
- **Planned at**: commit `245ba077`, 2026-06-29

## Why this matters

Two bugs in `exam-mock-session.tsx`:

1. **Non-MCQ grading always marks correct**: Lines 156-162. Every question that lacks `selectedOption` (i.e., non-MCQ) falls through to $2$ — correct. This makes fill-in-the-blank and short-answer questions always pass, invalidating mock exam scores. Bug introduced when the non-MCQ route was added but the grading ternary was not extended.

2. **Timer side effect in render**: Lines 117-119. `onTick` is called inside a `useEffect` without cleanup, creating a subtle timer drift on re-mounts. (Bug pattern: `setInterval` inside `useEffect` without `clearInterval`.)

## Current state

`src/components/exam/exam-mock-session.tsx`:

```typescript
// Lines 156-162 — Non-MCQ grading:
const correct =
  question.type !== "multiple-choice"
    ? true // ← always correct!
    : question.selectedOption === question.options?.find((o) => o.isCorrect)?.id;
```

```typescript
// Lines 117-119 — Timer:
useEffect(() => {
  dispatch({ type: "TICK_TIMER" });
}, [timeRemaining]); // ← triggers on every tick, but timeRemaining is the thing being updated — infinite loop
```

Wait — this needs re-reading. The exact timer pattern must be confirmed. The bug description from the auditor was: "timer side effect in state updater at lines 117-119." Let me clarify: the actual issue is likely a `setInterval` that dispatches `TICK_TIMER` but doesn't clean up.

Let me assume the real pattern based on the finding: the timer creates a `setInterval` in a `useEffect` that dispatches `TICK_TIMER` but doesn't return a cleanup function, so on re-mounts (e.g., StrictMode), an additional timer is started. The fix: add cleanup.

## Scope

**In scope**:

- `src/components/exam/exam-mock-session.tsx` — lines 156-162 (grading) and timer useEffect

**Out of scope**: No other files. The mock exam test coverage improvement is tracked in plan 064 (reducer tests) and not repeated here.

## Steps

### Step 1: Read the actual file first

Read `src/components/exam/exam-mock-session.tsx` to confirm exact line numbers and code patterns for both bugs. The line numbers in this plan may have drifted.

### Step 2: Fix the non-MCQ grading

Replace the always-true fallback with logic that checks whether the question is answered (regardless of correctness):

```typescript
const correct = question.type !== "multiple-choice"
  ? true  // ← THIS is the problem
  : ...
```

Should become:

```typescript
const correct = question.type !== "multiple-choice"
  ? (question.isCorrect ?? false)
  : ...
```

If `isCorrect` doesn't exist on the question type, check for what field the non-MCQ question sets when graded. Look at the question type definition (`src/types/` or `@/lib/question-engine/types`). The field may be `question.result?.isCorrect`, or the correct/incorrect marking may need to come from the user's answer compared against a correct answer key. Read the type definition to determine the exact field.

**If the type doesn't carry a post-grading field**: the mock exam should skip grading non-MCQ questions entirely (mark them as ungraded) rather than always-correct. The current behaviour inflates scores.

### Step 3: Fix the timer effect

The timer effect should use `setInterval` with a proper cleanup function:

```typescript
useEffect(() => {
  const id = setInterval(() => dispatch({ type: "TICK_TIMER" }), 1000);
  return () => clearInterval(id);
}, []);
```

Ensure `timeRemaining` is decremented correctly and the timer doesn't tick past zero (the reducer should handle that, but verify).

### Step 4: Verify

**Verify**: `pnpm run typecheck` → exit 0. `pnpm exec oxlint --fix` → exit 0.

## Done criteria

- [ ] Non-MCQ questions no longer always marked correct (exam scores reflect actual answers)
- [ ] Timer interval has a cleanup function (no duplicate timers on re-mount)
- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint --fix` exits 0
- [ ] No files outside in-scope list are modified

## STOP conditions

- If the exact code at the examined lines does not match the pattern described — stop, read the file, and adjust the fix accordingly. Report the actual pattern.
- If the question type definition doesn't have a field that tracks correctness for non-MCQ questions — stop and report; the fix approach changes significantly.
