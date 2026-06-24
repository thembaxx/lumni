# Advisor Plan 003: Fix Effect.void TypeScript warnings in 4 production files

> **Source**: Audit finding CORR-02
> **Priority**: P3
> **Effort**: S (minutes per file)
> **Risk**: LOW
> **Confidence**: HIGH

## Why this matters

`Effect.void` is deprecated since Effect 3.10 (replaced by `Effect.succeed(undefined)`). The Effect language service emits TS47 advisory warnings on 11 occurrences across 4 files. Not a build failure (tsc doesn't flag it) but indicates non-idiomatic Effect usage in newly-adopted code (Session 46, ADR-0013).

Per ADR-0013 conventions: "Use `Effect.succeed(undefined)` instead of `Effect.void`."

## Locations

### 1. `src/lib/ai/cached-ai-generator.ts` — Line ~62

```typescript
yield * Effect.tryPromise(() => table.put(entry)).pipe(Effect.catchAll(() => Effect.void));
```

Fix: `Effect.catchAll(() => Effect.succeed(undefined))`

### 2. `src/lib/gamification-engine/service.ts` — Lines ~88, ~131

```typescript
if (!dexieData) return Effect.void;
// ...
if (!res || !res.gamification) return Effect.void;
// ...
return Effect.void;
```

Fix: All three `Effect.void` → `Effect.succeed(undefined)`

### 3. `src/lib/rate-limiter/core.ts` — Line ~59

```typescript
Effect.catchAll(() => Effect.void),
```

Fix: `Effect.catchAll(() => Effect.succeed(undefined))`

### 4. `src/lib/tinyfish/rag-pipeline.ts` — Lines with Effect.catchAll using Effect.void (multiple occurrences)

```typescript
Effect.catchAll(() => Effect.void),
```

Fix: `Effect.catchAll(() => Effect.succeed(undefined))`

### 5. `src/lib/services/quiz-result-processor.ts` — Line with Effect.catchAll using Effect.void

```typescript
Effect.catchAll(() => Effect.void),
```

Fix: `Effect.catchAll(() => Effect.succeed(undefined))`

## Full list of 11 occurrences

| #    | File                             | Line ~    | Fix                                    |
| ---- | -------------------------------- | --------- | -------------------------------------- |
| 1    | `cached-ai-generator.ts`         | 62        | return `Effect.succeed(undefined)`     |
| 2    | `gamification-engine/service.ts` | 88        | return `Effect.succeed(undefined)`     |
| 3    | `gamification-engine/service.ts` | 131       | return `Effect.succeed(undefined)`     |
| 4    | `gamification-engine/service.ts` | after 131 | return `Effect.succeed(undefined)`     |
| 5-10 | `rag-pipeline.ts`                | 3 places  | catchAll → `Effect.succeed(undefined)` |
| 11   | `quiz-result-processor.ts`       | 1 place   | catchAll → `Effect.succeed(undefined)` |
| 12   | `rate-limiter/core.ts`           | 59        | catchAll → `Effect.succeed(undefined)` |

## Steps

1. For each file, replace `Effect.void` with `Effect.succeed(undefined)`
2. `pnpm run typecheck` → exit 0
3. `pnpm run test` → all pass

## Done criteria

- [ ] All 11+ `Effect.void` occurrences replaced with `Effect.succeed(undefined)`
- [ ] No effect on runtime behavior (identical semantics)
- [ ] `pnpm run typecheck` exits 0 (no new warnings)
- [ ] `pnpm run test` exits 0
