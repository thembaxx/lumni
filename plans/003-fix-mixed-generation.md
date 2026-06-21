# Plan 003: Fix mixed question generation redundant AI calls

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 8a6fadbe..HEAD -- src/lib/question-engine/question-engine.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `8a6fadbe`, 2026-06-21
- **Issue**: (omit)

## Why this matters

When generating mixed-type questions, the inner loop fires `Promise.allSettled(available.map(...))` which triggers an AI call for **every** available type, then breaks on the first success. In a 2-type batch, this fires 2 AI calls when only 1 is needed. A 10-question mixed quiz across 6 type batches wastes 6-8 paid Gemini/Nvidia/Groq API calls — real money burned on calls whose results are immediately discarded.

## Current state

**`src/lib/question-engine/question-engine.ts:334-347`**:
```typescript
const candidates = await Promise.allSettled(
  available.map((_, j) => {
    const tryType = available[(i + j) % available.length];
    const processor = this.registry.getProcessor(tryType);
    return processor.generate(
      {
        ...params,
        count: needed,
        questionType: tryType,
      },
      ragContext,
    );
  }),
);
for (const result of candidates) {
  if (result.status === "fulfilled") {
    results.push(...result.value);
    break;
  }
  console.error(`[QuestionEngine] Generation failed:`, result.reason);
}
```

The `available.map(...)` fires N generators in parallel. The `break` after the first success means only one type's results are used, but N-1 calls were wasted.

**Repo convention for AI calls**: Each `processor.generate()` triggers an AI provider call (Gemini → Nvidia → Groq). These cost money. The `QuestionEngine` is on the hot path for every quiz generation.

## Commands you will need

| Purpose   | Command                  | Expected on success |
|-----------|--------------------------|---------------------|
| Typecheck | `npx tsc --noEmit`       | exit 0, no errors   |
| Lint      | `npx biome check src/lib/question-engine/question-engine.ts` | 0 errors |
| Tests     | `bun run test`           | 1326+ pass, 0 fail  |

## Scope

**In scope**:
- `src/lib/question-engine/question-engine.ts` (lines 334-355)

**Out of scope**:
- `src/lib/question-engine/processors/` — do not change processor logic
- Other generation methods in question-engine.ts

## Git workflow

- Branch: `advisor/003-fix-mixed-generation`
- Commit: `perf: generate one type at a time in mixed mode instead of N parallel calls`

## Steps

### Step 1: Replace parallel map with single-type generation

Replace the `Promise.allSettled(available.map(...))` pattern with a single `processor.generate()` call for the current type only. If that fails, try the next type in the rotation sequentially:

```typescript
for (let i = 0; i < available.length && results.length < count; i++) {
  let needed = perType + (i < remainder ? 1 : 0);
  needed = Math.min(needed, count - results.length);
  if (needed <= 0) continue;

  let generated = false;
  for (let j = 0; j < available.length && !generated; j++) {
    const tryType = available[(i + j) % available.length];
    const processor = this.registry.getProcessor(tryType);
    try {
      const questions = await processor.generate(
        {
          ...params,
          count: needed,
          questionType: tryType,
        },
        ragContext,
      );
      if (questions.length > 0) {
        results.push(...questions);
        generated = true;
      }
    } catch (e) {
      console.error(`[QuestionEngine] Generation failed for ${tryType}:`, e);
    }
  }
}
```

This fires at most N calls per type slot (sequential fallback), not N calls simultaneously. For the happy path (first type succeeds), it's 1 call instead of N.

**Verify**: `npx biome check src/lib/question-engine/question-engine.ts` → 0 errors

### Step 2: Run full verification

```bash
npx tsc --noEmit
npx biome check src/lib/question-engine/question-engine.ts
bun run test
```

## Test plan

- The existing question-engine tests should continue passing (they test generation logic).
- If `src/lib/question-engine/__tests__/question-engine.test.ts` exists, verify it covers mixed-type generation. If not, add a test that verifies:
  - `generateMixed` with 2 types produces questions from both types (not just one)
  - When the first type fails, fallback to second type works

## Done criteria

- [ ] `npx tsc --noEmit` exits 0
- [ ] `npx biome check src/lib/question-engine/question-engine.ts` exits 0
- [ ] `bun run test` exits 0
- [ ] `grep -n "Promise.allSettled" src/lib/question-engine/question-engine.ts` returns no matches in the `generateMixed` method (lines 320-359)
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

- The `processor.generate()` call does not throw on failure (it may return an empty array instead of throwing).
- The existing tests fail after the change.

## Maintenance notes

- The sequential fallback adds latency when the first type fails (waits for failure before trying next). This is acceptable because: (a) the first type usually succeeds, and (b) the parallel version wasted money on all types anyway.
- If question diversity is a concern, consider shuffling `available` before the loop so different types get tried first across batches.
