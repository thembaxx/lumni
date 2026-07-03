# Plan P007: Add Discriminant Union to AIResult Type

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `advisor-plans/README.md`.
>
> **Drift check**: `git diff --stat e02ad4fc..HEAD -- src/lib/ai/`
> If any AI file changed, compare excerpts against live code.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: MED
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `e02ad4fc`, 2026-07-03

## Why this matters

`AIResult = AIResponse | AIFailure` uses duck-typing — consumers check `'error' in result` or `'content' in result` to discriminate between success and failure. If either type gains a field that overlaps with the other (e.g., `AIResponse` adds an `error` field, or `AIFailure` gains a `content` field), all consumers break silently at runtime. The `as AIFailure` cast at `src/lib/ai/client.ts:251` masks the problem further by suppressing the compiler's ability to catch type drift.

## Current state

**`src/lib/ai/types.ts:14-28`**:

```typescript
export interface AIResponse {
  content: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIFailure {
  error: string;
  provider: string;
  available: boolean;
}

export type AIResult = AIResponse | AIFailure;
```

**`src/lib/ai/client.ts:248-251`** — the unnecessary cast:

```typescript
return {
  ...FAILURE_RESPONSE,
  error: `All providers failed. Last error: ${lastError}`,
} as AIFailure;
```

**Consumers** that use duck-typing (`'error' in result`):

- Potentially in: `processor-registry.ts`, `latency-tracker.ts`, `parse-response.ts`, and any `Grader` or `QuestionProcessor` that handles AI results.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0, no errors   |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm exec oxlint`   | exit 0              |

## Scope

**In scope**:

- `src/lib/ai/types.ts` — add `type` discriminant
- `src/lib/ai/client.ts` — remove `as AIFailure` cast, use discriminant
- All files that discriminate `AIResult` using `'error' in result` → change to `result.type === "success"` or `result.type === "failure"`

**Out of scope**:

- Any non-AI types or patterns
- Adding test files
- Refactoring the `AIRequest`, `TaskRequest`, or `ChatMessage` types

## Git workflow

- Branch: `advisor/P007-ai-discriminant`
- Commit message: `fix: add type discriminant to AIResult union, remove as-cast`
- Do NOT push or open a PR

## Steps

### Step 1: Add `type` discriminant to the interfaces

In `src/lib/ai/types.ts`, add the discriminant:

```typescript
export interface AIResponse {
  type: "success";
  content: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIFailure {
  type: "failure";
  error: string;
  provider: string;
  available: boolean;
}
```

### Step 2: Fix `client.ts` to use the discriminant

In `src/app/lib/ai/client.ts:248-251`, remove the `as AIFailure` cast. The spread of `FAILURE_RESPONSE` should already be typed as `AIFailure`:

```typescript
return {
  ...FAILURE_RESPONSE,
  error: `All providers failed. Last error: ${lastError}`,
};
```

If TypeScript complains, check that `FAILURE_RESPONSE` is properly typed as `AIFailure`.

### Step 3: Find and update all duck-typing consumers

`grep` for `'error' in result` or `"error" in result` across `src/`:

```bash
grep -rn '"error" in result\|'"'"'error'"'"' in result' --include="*.ts" --include="*.tsx" src/
```

For each match, replace:

```typescript
// Old:
if ("error" in result) {
  /* handle failure */
}
// New:
if (result.type === "failure") {
  /* handle failure */
}
```

And for success checks:

```typescript
// Old:
if ("content" in result) {
  /* handle success */
}
// New:
if (result.type === "success") {
  /* handle success */
}
```

### Step 4: Verify

**Verify**: `pnpm run typecheck` → exit 0 (the discriminant now makes the union discriminated — TypeScript can narrow correctly). `pnpm exec oxlint` → exit 0. `pnpm run test` → all pass.

## Test plan

No new tests needed. The discriminant change is type-level only; runtime behavior is identical.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm exec oxlint` exits 0
- [ ] `pnpm run test` all pass
- [ ] `grep -rn "'error' in result\|"error" in result" --include="*.ts" --include="*.tsx" src/` returns no matches
- [ ] `grep -rn "as AIFailure" --include="*.ts" --include="*.tsx" src/` returns no matches
- [ ] `advisor-plans/README.md` status row updated

## STOP conditions

Stop and report back if:

- Any consumer uses `result` in a way that doesn't narrow correctly with the discriminant (TypeScript compiler error)
- The `FAILURE_RESPONSE` constant in `client.ts` is typed as `AIFailure` and removing `as AIFailure` still compiles (should work, but verify)

## Maintenance notes

- Adding a `type` field to both types makes `AIResult` a proper discriminated union. Any new consumer of `AIResult` must use `result.type` to narrow, not property-checking.
- If a new field is added to either type that might overlap with the other's fields, the union-wide type guard still works correctly because `type` is the sole discriminant.
