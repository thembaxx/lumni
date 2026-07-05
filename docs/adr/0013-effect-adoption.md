# ADR-0013: Effect TS Adoption Strategy

**Status:** Partially Implemented — Evidence Drift (July 2026)
**Driver:** @opencode

## Context

The Lumni codebase (1387 `.ts`/`.tsx` files) uses imperative-reactive patterns: Zustand for state management, TanStack Query for async data, and manual try/catch for error handling. This works but creates several recurring pain points:

1. **Error handling is scattered** — 148 empty catch blocks were found and patched in Session 23; errors-as-values with type safety is not enforced
2. **Dependency injection is ad-hoc** — global singletons (`getAI()`), constructor injection, and module-level state coexist without a uniform pattern
3. **Async composition is verbose** — provider fallback chains, retry logic, and parallel execution require manual `Promise.allSettled` + loop plumbing
4. **No standard library** — JSON serialization, CLI parsing, schema validation each need separate dependencies

## Decision

Adopt Effect TS as a strategic foundation, starting with a single bounded subsystem (`cached-ai-generator.ts`) before expanding.

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

1. **Install** `effect`, `@effect/platform`, `@effect/language-service`
2. **Configure** tsconfig plugin, prepare script patch, clone effect-smol for agent reference
3. **Refactor one subsystem** — `cached-ai-generator.ts` introduces Effect in a bounded context
4. **Document** conventions in AGENTS.md for consistent future adoption

## Scope (Phase 1)

### In scope

- `effect` + `@effect/platform` as runtime dependencies
- `@effect/language-service` as dev dependency
- tsconfig plugin registration + TypeScript patch via prepare script
- `CachedAIGenerator<T>` (`src/lib/ai/cached-ai-generator.ts`) uses Effect for cache/generate pipeline
- ADR + AGENTS.md documentation
- All existing typecheck, lint, and test gates pass

### Out of scope

- Refactoring React hooks, components, or pages to use Effect
- Replacing Zustand or TanStack Query
- Using `@effect/cli`, `@effect/schema` (schema lives in `effect/Schema`)
- Adopting `@effect/rpc` or `@effect/cluster`
- Migrating existing services or repositories

## Consequences

### Positive

- Type-safe error handling: `cached-ai-generator.ts` demonstrates `Effect.catchAll` for boundary error handling
- Proves the seam: the isolated Effect pattern validates that Effect can be adopted incrementally without breaking consumers
- Agent-friendly: effect-smol repo cloned locally for AI grep, effect-solutions CLI for pattern discovery

### Negative

- Learning curve for developers unfamiliar with Effect/generators
- Dual patterns during migration: imperative and effectful code coexist
- `Effect.runPromise()` adapter calls are easy to forget, losing typed error tracking

## Implementation

### Current Reality (July 2026)

The Phase 1 ambition to refactor the AI provider chain to Effect was not completed. The actual state is:

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

This is the recommended template for new Effect code: bounded, isolated, with a clean `Effect.runPromise()` adapter at the boundary. See ADR-0013 for adoption status.

## References

- https://effect.website — official docs
- https://www.effect.solutions — best practices & patterns
- `~/.local/share/effect-solutions/effect` — cloned Effect v4 source for AI agent reference
- `src/lib/ai/cached-ai-generator.ts` — Effect pattern reference (cache/generate pipeline)
