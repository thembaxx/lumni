# Plan 165: Fix `generateMixed` 7x Parallel AI Cost Waste

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/question-engine/batch-generator.ts src/lib/question-engine/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

When generating mixed-type questions (e.g., `count=10`), `generateMixed()` fires 7 parallel AI batches — each requesting `Math.ceil(10/7)=2` questions. The result is `.slice(0, count)`, so 6 out of 7 batches are discarded. Each discarded batch costs a full AI API call (Gemini → Nvidia → Groq chain). For free-tier AI with a 2000-call/day global budget, this means each mixed quiz burns up to 7× the budget it should, and users hit rate limits faster.

## Current state

In `src/lib/question-engine/batch-generator.ts`, `generateMixed()`:

```typescript
// ~line 38-96
generateMixed(count, ...): Promise<Question[]> {
  const batchGroups = this.getBatchGroups(count); // splits into 7 groups
  const promises = batchGroups.map(group =>
    this[group.type](group.count) // each fires an AI call
  );
  const results = await Promise.all(promises);
  return results.flat().slice(0, count); // discards excess
}
```

Each batch group requests `Math.ceil(count / 7)` questions. For `count=10`, each of 7 batches asks for 2. Total AI cost: 7 calls, returning 14 questions. 6 of those were wasted.

The repo convention for AI calls: respect the token budget (see `src/lib/ai/client.ts` for the provider chain). Use the existing `logError` pattern for error logging.

## Commands you will need

| Purpose   | Command                                           | Expected on success |
| --------- | ------------------------------------------------- | ------------------- |
| Install   | `pnpm install`                                    | exit 0              |
| Typecheck | `pnpm run typecheck`                              | exit 0, no errors   |
| Tests     | `pnpm run test -- --run src/lib/question-engine/` | all pass            |
| Lint      | `pnpm exec oxlint --fix`                          | exit 0              |

## Scope

**In scope**:

- `src/lib/question-engine/batch-generator.ts`

**Out of scope**:

- `src/lib/question-engine/question-engine.ts` — only the caller
- Processor registry, prompt manager, or types

## Steps

### Step 1: Change `generateMixed` from parallel to sequential with early exit

Rewrite the batch loop in `generateMixed()` to:

1. Determine the order of batch groups (prioritize most common question types first if the existing code has a priority — preserve existing order otherwise)
2. Iterate batch groups sequentially
3. After each batch, check if `questions.length >= count` and break early
4. For later batches, reduce `itemCount` if we only need a few more questions (so we don't over-request)

The key change: replace `Promise.all(batchGroups.map(...))` with a `for...of` loop.

```typescript
// Pseudocode for the new approach
const questions: Question[] = [];
for (const group of batchGroups) {
  const remaining = count - questions.length;
  if (remaining <= 0) break;
  const batch = await this[group.type](Math.min(group.count, remaining));
  questions.push(...batch);
}
return questions.slice(0, count);
```

**Verify**: `pnpm run test -- --run src/lib/question-engine/batch-generator.test.ts` → all pass

### Step 2: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run src/lib/question-engine/` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing batch-generator tests should continue passing (the output contract is the same — `Question[]` with `length <= count`). If there's a test that specifically asserts `Promise.all` was called (mocking), update it to expect sequential calls instead.

Key edge cases to verify:

- `count=1` → only first batch group fires
- `count=100` → all batch groups fire, total ≤ 100
- `count=0` → no batches fire at all (check early return)

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- --run src/lib/question-engine/` exits 0
- [ ] No `Promise.all` over batch groups in `generateMixed`
- [ ] Sequential iteration with early exit when count satisfied
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The current code structure differs significantly from the excerpts
- Tests fail after step 1 and can't be fixed with test assertion updates
- The `getBatchGroups` method signature is different from expected

## Maintenance notes

The sequential approach is slightly slower wall-clock-time per call (no parallelism), but eliminates 6× cost waste. If latency is critical, a future improvement could parallelize the first 2-3 groups and fall back to sequential for the rest. For now, the budget savings outweigh latency.
