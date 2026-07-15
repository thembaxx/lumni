# Plan 167: Fix Zero-Result Retry Loop Burning 3x AI Calls

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/question-engine/question-engine.ts`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

When the AI provider returns 0 questions (token limit, prompt error, provider failure), the retry loop in `generateInternal` burns 3 full AI calls with no chance of recovery. Each attempt runs `result.length > questions.length` which is `0 > 0` = false, so `questions = result` never executes, but the loop continues. At the 2000-call/day global budget, 3 wasted calls per failure adds up fast.

## Current state

In `src/lib/question-engine/question-engine.ts`, lines ~145-153:

```typescript
for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
  const result = await generateBatch(this.registry, enriched, ragContext, remainingCount);
  if (result.length > questions.length) {
    questions = result;
    if (questions.length >= remainingCount) {
      break;
    }
  }
}
```

When `result.length === 0`:

- `0 > 0` = false → `questions = result` never executes
- Loop continues to next attempt → another full AI call
- After MAX_RETRIES attempts, returns 0 questions

## Commands you will need

| Purpose   | Command                                           | Expected on success |
| --------- | ------------------------------------------------- | ------------------- |
| Install   | `pnpm install`                                    | exit 0              |
| Typecheck | `pnpm run typecheck`                              | exit 0, no errors   |
| Tests     | `pnpm run test -- --run src/lib/question-engine/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                          | exit 0              |

## Scope

**In scope**:

- `src/lib/question-engine/question-engine.ts`

## Steps

### Step 1: Add early exit for zero-result batches

In the retry loop in `generateInternal` (`src/lib/question-engine/question-engine.ts`), add an `else if` clause after the existing `if (result.length > questions.length)`:

```typescript
if (result.length > questions.length) {
  questions = result;
  if (questions.length >= remainingCount) {
    break;
  }
} else if (result.length === 0) {
  // AI returned 0 questions — further retries won't help
  break;
}
```

**Verify**: `rg "result\.length === 0" src/lib/question-engine/question-engine.ts` → 1 match

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/question-engine/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing tests should pass. If there's a test that verifies retry behavior with empty results, update its expectations (it should now break on first zero, not retry). No new tests required for this simple guard.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/question-engine/` exits 0
- [ ] Zero-result branch breaks loop instead of continuing
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The retry loop code differs from the excerpt (the condition, variable names, or structure)
- Adding the `else if` guard causes test failures
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

This guard assumes that 0 questions from AI means "provider failure" not "needs retry". If AI providers intermittently return 0 for valid generation requests, this guard may need revisiting. For now, 3x cost is worse than a rare false early-exit.
