# Plan 227: Consolidate 3 competing DI patterns — migrate `_deps` consumers to constructor DI

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: L
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / di-pattern
- **Generated at**: 2026-07-17

## Why this matters

Three different DI patterns coexist in the codebase: (1) mutable module-level `let _deps` with `__setDepsForTesting()`, (2) constructor DI via class constructor params, (3) function parameter `deps?` objects. The `_deps` pattern is test-hostile — mutations persist across test files, creating false-positive cross-test pollution. It also uses a side-channel (`__setDepsForTesting`) that doesn't scale and is invisible to static analysis.

## Current state

19 lib files use `let _deps` mutable module-level pattern (23 including `_deps`-adjacent patterns like `__setDepsForTesting`). Key files:

- `src/lib/tinyfish/cache.ts` — `let _deps: TinyFishDB | null = null`
- `src/lib/observability/events.ts` — `let _deps: { db: EventDb }`
- `src/lib/orchestrator/handlers/domain.ts` — `let _deps: { db: DomainDb }`
- `src/lib/retention-loop/next-action.ts` — `let _deps: { db: NextActionDb }`
- `src/lib/question-engine/enrichment-pipeline.ts` — `let _deps: EnrichmentDeps`
- `src/lib/integration/service.ts` — `let _deps: { db: IntegrationDb }`
- `src/lib/sync/sync-handler.ts` — `let _deps: { db: SyncHandlerDb }`
- `src/lib/services/search-service/deps.ts` — `export function __setDepsForTesting`
- `src/lib/services/notification-service/deps.ts` — `export function __setDepsForTesting`
- Plus 11 more in `ai/chat-context.ts`, `bolt/resolve-weakest.ts`, `collaborative/session-service.ts`, `dictionary/service.ts`, `exam-dates/service.ts`, `knowledge-graph/service.ts`, `lesson/service.ts`, `study-guide/service.ts`, `pronunciation-history/service.ts`, `stories/service.ts`, `vocabulary/service.ts`

64 files already use constructor DI (the correct pattern).

## Target state

All `_deps` and `__setDepsForTesting` patterns migrated to one of:

- **Class-based constructor DI**: for stateful services (e.g., `class FooService { constructor(private db: FooDb) }`)
- **Deps function argument**: for module-free functions (e.g., `function bar(deps?: { db: BarDb })`)

No mutable module-level state. No `__setDepsForTesting` exports.

## Scope

- Migrate all 19 `let _deps` files to constructor DI or Deps arg pattern
- Remove `__setDepsForTesting` exports from `search-service/deps.ts` and `notification-service/deps.ts`
- Update test files that use `__setDepsForTesting` to use constructor injection instead
- Do NOT change any consumer-facing API signatures

## Steps

### 1. Audit and classify all 19 `_deps` files

Group by migration strategy:

- **Class-based**: `orchestrator/handlers/domain.ts`, `orchestrator/handlers/sync-handlers.ts`, `sync/sync-handler.ts`, `retention-loop/next-action.ts`, `observability/events.ts`
- **Function deps arg**: `dictionary/service.ts`, `exam-dates/service.ts`, `integration/service.ts`, `pronunciation-history/service.ts`, `vocabulary/service.ts`, `tinyfish/cache.ts`, `knowledge-graph/service.ts`, `lesson/service.ts`, `study-guide/service.ts`, `stories/service.ts`, `ai/chat-context.ts`, `bolt/resolve-weakest.ts`, `question-engine/enrichment-pipeline.ts`, `collaborative/session-service.ts`

### 2. Migrate function-deps-arg files

For each file:

- Add `deps?: { db: XyzDb }` as last parameter to each exported function
- Replace `_deps.db` with `deps?.db ?? dexieDataAccess`
- Remove `let _deps` and `export function __setDepsForTesting`
- Update tests to pass `deps` directly instead of calling `__setDepsForTesting`

### 3. Migrate class-based files

For each file:

- Add `db: XyzDb` to constructor params
- Store as `this.db`
- Replace `_deps.db` with `this.db`
- Remove `let _deps` and `__setDepsForTesting`
- Update instantiation sites to pass `db` in constructor
- Update tests to instantiate with a mock `db`

### 4. Remove `__setDepsForTesting` from services

- `src/lib/services/search-service/deps.ts` — remove `export function __setDepsForTesting`
- `src/lib/services/notification-service/deps.ts` — remove `export function __setDepsForTesting`
- Update test files to import `dexieDataAccess` directly or use the new constructor/deps pattern

### 5. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm run test` — no regressions (compare against baseline before starting)

Verification: `pnpm run typecheck ; pnpm run test`

## Stop conditions

- Any test file that depended on `__setDepsForTesting` cannot be updated cleanly — stop and assess the test structure before proceeding
- More than 1 file shows cross-test pollution in CI — revert and re-evaluate migration order

## Estimated time

4-6 hours
