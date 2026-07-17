# Plan 226: Resolve dual searchWeb barrel export — rename server-side function to avoid collision

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: none
- **Category**: tech-debt / clean-barrel
- **Generated at**: 2026-07-17

## Why this matters

`src/lib/services/index.ts` re-exports `searchWeb` from both `./search-service` (client-side Dexie search) and `./web-search-service` (server-side Exa search, aliased as `webSearch`). This dual export with different names for the same verb creates confusion for consumers — which one does what? Additionally, `__setDepsForTesting` from `./search-service` leaks into the public barrel, which is a test-only function that should never be in the public API surface.

## Current state

`src/lib/services/index.ts:27,33`:

```ts
export { searchAll, searchWeb } from "./search-service";
export { searchWeb as webSearch } from "./web-search-service";
```

`src/lib/services/search-service/index.ts:2`:

```ts
export { __setDepsForTesting } from "./deps";
```

Result: Barrel exports `searchWeb` (client), `webSearch` (server), and `__setDepsForTesting`.

## Target state

- Server Exa function renamed to `searchWebExa` (or `exaSearch`) internally and in the barrel
- `__setDepsForTesting` removed from the barrel chain (only imported directly from the module file by tests)
- Consumers of `webSearch` updated to use the new name

## Scope

- `src/lib/services/index.ts` — rename `webSearch` to `searchWebExa`, remove `__setDepsForTesting` from barrel
- `src/lib/services/search-service/index.ts` — stop re-exporting `__setDepsForTesting`
- `src/lib/services/web-search-service.ts` — rename exported function to `searchWebExa`
- Grep for consumers importing `webSearch` and update them

## Steps

### 1. Rename server function

- In `src/lib/services/web-search-service.ts`: change `export function searchWeb` to `export function searchWebExa`
- In `src/lib/services/index.ts`: change `export { searchWeb as webSearch }` to `export { searchWebExa }`
- Grep for `from "@/lib/services"` importing `webSearch` and update to `searchWebExa`

### 2. Remove `__setDepsForTesting` from barrel

- In `src/lib/services/search-service/index.ts`: remove `export { __setDepsForTesting } from "./deps"`
- Keep the function in `deps.ts` — test files import it directly already (`src/lib/services/search-service/__tests__/search-service.test.ts` imports from `"../index"` — verify this still resolves)

### 3. Verify no broken imports

- Run `pnpm run typecheck` — must pass with 0 errors

Verification: `pnpm run typecheck ; pnpm exec oxlint ; pnpm run test`

## Stop conditions

- Any file imports `webSearch` that cannot be found — stop and verify the rename propagated to all consumers

## Estimated time

20 minutes
