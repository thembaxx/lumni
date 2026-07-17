# Plan 211: Fix `null as never` type escape hatches in Effect pipelines

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: S
- **Risk**: LOW (latent HIGH — downstream consumers may assume non-null)
- **Depends on**: none
- **Category**: bug / type-safety

## Why this matters

`Effect.succeed(null as never)` is a type escape hatch that lies to the type system. When `Effect.catchAll` installs a fallback via `null as never`, the Effect's success type remains `T` (not `T | null`), so downstream code that uses the Effect return type never accounts for `null`. If the fallback fires at runtime, the `null` value propagates undetected through typed code, causing crashes when properties are accessed on `null`. The codebase has already established the correct pattern in `processor.ts:70` (`Effect.succeed({ ... } as GradingResult)`) and `processor.ts:108` (`Effect.succeed("")`) — only these 4 sites still use the `null as never` anti-pattern.

## Current state

**Site 1 — `processor.ts:90`**:

```ts
return Effect.gen(function* () {
  const prompt = self.prompts.getPrompt(self.type, params, ragContext);
  const result = yield* Effect.tryPromise(() =>
    self.ai.generateWithSystem(prompt.system, prompt.user, { ... }),
  ).pipe(Effect.catchAll(() => Effect.succeed(null as never)));
  if (!result) {
    return [];
  }
  // ...
});
```

The declared return type is `Effect.Effect<Question<T>[]>`. After `catchAll`, it's actually `Effect.Effect<Question<T>[] | null>`, but the `as never` hides this.

**Sites 2-3 — `graders/shared.ts:60,157`**:

```ts
// Line 60: aiGradeResultEffect
const result = yield* Effect.tryPromise(() =>
  ai.generateWithSystem(/* ... */, { /* ... */ }),
).pipe(Effect.catchAll(() => Effect.succeed(null as never)));

// Line 157: aiHintFactoryEffect
const result = yield* Effect.tryPromise(() =>
  ai.generateWithSystem(systemContent, userContent, { /* ... */ }),
).pipe(Effect.catchAll(() => Effect.succeed(null as never)));
```

Both have declared or inferred return types that exclude `null`.

## Target state

Remove all 4 `as never` casts. Change Effect return type annotations (where explicit) to `T | null`. The existing `if (!result) return fallback` guards already handle the null case — they just need the type system to agree.

- `processor.ts` — `generateEffect` return type: `Effect.Effect<Question<T>[]>` → `Effect.Effect<Question<T>[] | null>`. The `if (!result) return []` already handles null.
- `graders/shared.ts:60` — `aiGradeResultEffect` return type: annotate as `Effect.Effect<{ correct: boolean; ... } | null>` if explicit, or let inference add `| null`. The `if (!result)` guard at line 61 already handles null.
- `graders/shared.ts:157` — `aiHintFactoryEffect` return: annotate as `Effect.Effect<string | null>`. The `if (!result) return q.hint` already handles null.

## Scope

- `src/lib/question-engine/processors/processor.ts` — line 90
- `src/lib/question-engine/processors/graders/shared.ts` — lines 60, 157
- No other files. However, if `aiGradeResultEffect` has a declared return type that excludes null, update it too.
- NOT changing any other `as never` or `as any` in the codebase — those are separate plans (see Plan 214).

## Steps

### 1. Fix `processor.ts`

File: `src/lib/question-engine/processors/processor.ts`

Change line 90 from:

```ts
).pipe(Effect.catchAll(() => Effect.succeed(null as never)));
```

to:

```ts
).pipe(Effect.catchAll(() => Effect.succeed(null)));
```

If the `generateEffect` method has an explicit return type annotation, update from `Effect.Effect<Question<T>[]>` to `Effect.Effect<Question<T>[] | null>`.

### 2. Fix `graders/shared.ts:60`

Change:

```ts
).pipe(Effect.catchAll(() => Effect.succeed(null as never)));
```

to:

```ts
).pipe(Effect.catchAll(() => Effect.succeed(null)));
```

If `aiGradeResultEffect` has an explicit return type annotation, update to include `| null`.

### 3. Fix `graders/shared.ts:157`

Same pattern — remove `as never`.

### 4. Check downstream consumers

Search for callers of `aiGradeResultEffect` and `generateEffect` that may assume non-null returns:

```bash
rg "generateEffect\(" src/lib/
rg "aiGradeResultEffect\(" src/lib/
```

If any caller destructures the result without null-checking, add a guard or null-coalescing fallback.

### 5. Verify

```bash
pnpm run typecheck
pnpm exec biome check --write
pnpm run test
```

Expected: zero type errors, no regressions in tests.

## Stop conditions

- Any file outside the 2 listed is modified — stop and revert
- `pnpm run typecheck` fails
- More than 1 test regresses

## Estimated time

30-45 minutes
