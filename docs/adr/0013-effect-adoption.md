# ADR-0013: Effect TS Adoption Strategy

**Status:** Hold — Pragmatic Adoption (July 2026)
**Driver:** @opencode

## Context

The Lumni codebase (1387 `.ts`/`.tsx` files) uses imperative-reactive patterns: Zustand for state management, TanStack Query for async data, and manual try/catch for error handling. This works but creates several recurring pain points:

1. **Error handling is scattered** — 148 empty catch blocks were found and patched in Session 23; errors-as-values with type safety is not enforced
2. **Dependency injection is ad-hoc** — global singletons (`getAI()`), constructor injection, and module-level state coexist without a uniform pattern
3. **Async composition is verbose** — provider fallback chains, retry logic, and parallel execution require manual `Promise.allSettled` + loop plumbing
4. **No standard library** — JSON serialization, CLI parsing, schema validation each need separate dependencies

## Decision

Effect TS is used in 17 production files for async composition (`Effect.gen` + `Effect.tryPromise` + `Effect.catchAll`) in `cached-ai-generator.ts` and downstream consumers. The broader ecosystem (`Context.Tag`, `Layer`, `@effect/platform`, `@effect/vitest`) was explored but remains unused. The scaffolding intended for a full migration has been removed per Plan 097.

### Why Effect over alternatives

| Criterion        | Effect                                 | fp-ts                   | Manual patterns    |
| ---------------- | -------------------------------------- | ----------------------- | ------------------ |
| Error handling   | `Effect<A, E, R>` with typed errors    | Similar, but no runtime | try/catch, untyped |
| DI               | `Context.Tag + Layer`                  | ReaderTaskEither        | Global singletons  |
| Async            | Effect (suspend, retry, timeout, race) | TaskEither              | Promise chains     |
| Standard library | Schema, Config, CLI, Stream, HTTP      | io-ts (separate)        | One-off deps       |
| Learning curve   | Moderate                               | High (HKT encoding)     | None               |
| Bundle size      | ~15k core (tree-shaken)                | N/A                     | N/A                |

### Chosen approach

1. **Install** `effect` (runtime dependency)
2. **Refactor one subsystem** — `cached-ai-generator.ts` introduces Effect in a bounded context
3. **Document** conventions in AGENTS.md for pragmatic adoption
4. **Remove scaffolding** per Plan 097 when full migration is ruled out

## Scope (Phase 1)

### In scope

- `effect` as a runtime dependency
- `CachedAIGenerator<T>` (`src/lib/ai/cached-ai-generator.ts`) uses Effect for cache/generate pipeline
- ADR + AGENTS.md documentation
- All existing typecheck, lint, and test gates pass

### Out of scope

- Refactoring React hooks, components, or pages to use Effect
- Replacing Zustand or TanStack Query
- Using `@effect/cli`, `@effect/schema`, `@effect/platform`
- Adopting `@effect/rpc` or `@effect/cluster`
- Migrating existing services or repositories
- `Context.Tag` / `Layer` DI (not used anywhere)

## Consequences

### Positive

- Type-safe error handling: `cached-ai-generator.ts` demonstrates `Effect.catchAll` for boundary error handling
- Proves the seam: the isolated Effect pattern validates that Effect can be adopted incrementally without breaking consumers

### Negative

- Learning curve for developers unfamiliar with Effect/generators
- `Effect.runPromise()` adapter calls are easy to forget, losing typed error tracking

## Implementation

### Current Reality (July 2026)

The Phase 1 ambition to refactor the AI provider chain to Effect was not completed. The actual state is:

> **Plan 097 (July 2026):** Removed unused Effect scaffolding — `@effect/language-service` dev dependency, tsconfig plugin, and prepare script patch. ADR-0013 status updated to "Hold — Pragmatic Adoption". AGENTS.md Effect section trimmed to match actual usage.

| Claim (original ADR)               | Reality                                                               |
| ---------------------------------- | --------------------------------------------------------------------- |
| AI client refactored to Effect     | `src/lib/ai/client.ts` uses `for...of`/`try/catch` — 0 Effect imports |
| `uniform-adapter.ts` created       | File does not exist; was documented but never implemented             |
| `PROGRESS.md` tracking file exists | Never created                                                         |
| Effect proven via provider chain   | Effect proven via `cached-ai-generator.ts` only                       |

### What Exists

- **`src/lib/ai/cached-ai-generator.ts`** — the only production file importing from `effect`. Contains ~5 `Effect.gen` blocks across 108 lines. Works correctly with cache-read → AI-generate → cache-store pipeline. Demonstrates the `const self = this` capture pattern, `Effect.tryPromise` for promise bridges, and `Effect.catchAll` for boundary error handling.

- **`docs/adr/0013-effect-adoption.md`** — this file (drifted from reality, now corrected).

- **`AGENTS.md`** — Effect conventions section has been corrected to reference `cached-ai-generator.ts` instead of `client.ts`.

### What Does Not Exist

- **`src/lib/ai/uniform-adapter.ts`** — documented in `Session 28` notes as a factory for pluggable provider normalizers, but never created.
- **Effect-ified AI client** — the provider fallback chain (`Gemini → Nvidia → Groq`) remains a plain `for...of` loop with `try/catch` in `src/lib/ai/client.ts:callWithFallback()`.

### CachedAIGenerator Pattern

The Effect pattern is demonstrated in `src/lib/ai/cached-ai-generator.ts` (~5 Effect.gen blocks):

```ts
import { Effect } from "effect";

generateEffect(subject: string, topic: string): Effect.Effect<T> {
  const self = this;
  return Effect.gen(function* () {
    const result = yield* Effect.tryPromise(() => ...)
      .pipe(Effect.catchAll(() => Effect.succeed(null)));
    // ...
  });
}
```

This is the recommended template for new Effect code: bounded, isolated, with a clean `Effect.runPromise()` adapter at the boundary.

## References

- https://effect.website — official docs
- https://www.effect.solutions — best practices & patterns
- `src/lib/ai/cached-ai-generator.ts` — Effect pattern reference (cache/generate pipeline)
- `docs/decisions/2026-07-05-effect-strategy-recommendation.md` — Plan 095 recommendation (Hold)
