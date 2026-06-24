# ADR-0013: Effect TS Adoption Strategy

**Status:** Implemented — Phase 1 (June 2026)
**Driver:** @opencode

## Context

The Lumni codebase (1387 `.ts`/`.tsx` files) uses imperative-reactive patterns: Zustand for state management, TanStack Query for async data, and manual try/catch for error handling. This works but creates several recurring pain points:

1. **Error handling is scattered** — 148 empty catch blocks were found and patched in Session 23; errors-as-values with type safety is not enforced
2. **Dependency injection is ad-hoc** — global singletons (`getAI()`), constructor injection, and module-level state coexist without a uniform pattern
3. **Async composition is verbose** — provider fallback chains, retry logic, and parallel execution require manual `Promise.allSettled` + loop plumbing
4. **No standard library** — JSON serialization, CLI parsing, schema validation each need separate dependencies

## Decision

Adopt Effect TS as a strategic foundation, starting with a single bounded subsystem (the AI client) before expanding.

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
3. **Refactor one subsystem** — the AI client (provider chain with fallback) demonstrates the canonical pattern
4. **Document** conventions in AGENTS.md for consistent future adoption

## Scope (Phase 1)

### In scope

- `effect` + `@effect/platform` as runtime dependencies
- `@effect/language-service` as dev dependency
- tsconfig plugin registration + TypeScript patch via prepare script
- AI client (`src/lib/ai/client.ts`) refactored to use Effect for the provider chain
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

- Type-safe error handling: the `_callProviders` chain now expresses fallback as a typed `Effect.catchAll` pipeline
- Self-documenting provider chain: the retry-or-fail logic is explicit, not hidden in a `for` loop
- Proves the seam: the AI client refactor validates that Effect can be adopted incrementally without breaking consumers
- Agent-friendly: effect-smol repo cloned locally for AI grep, effect-solutions CLI for pattern discovery

### Negative

- Learning curve for developers unfamiliar with Effect/generators
- Dual patterns during migration: imperative and effectful code coexist
- `Effect.runPromise()` adapter calls are easy to forget, losing typed error tracking

## Technical Details

### AI Client Refactor Pattern

The provider chain follows this canonical pattern:

```ts
// Define typed errors
interface ProviderError {
  readonly _tag: "ProviderError";
  readonly message: string;
  readonly provider: string;
}

// Define effect type
type AIEffect = Effect<AIResponse, ProviderError>;

// Use Effect.gen for sequential fallback
Effect.gen(function* () {
  // ... providers, each yielding with catchAll
});
// Wrap boundary with Effect.runPromise
```

This pattern is the recommended template for all future Effect adoption.

## References

- https://effect.website — official docs
- https://www.effect.solutions — best practices & patterns
- `~/.local/share/effect-solutions/effect` — cloned Effect v4 source for AI agent reference
- `src/lib/ai/client.ts` — canonical Effect provider chain implementation
