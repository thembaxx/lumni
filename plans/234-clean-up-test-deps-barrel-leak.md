# Plan 234: Clean up barrel leak — remove \_\_setDepsForTesting from public services/index

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.

## Status

- **Priority**: P3
- **Effort**: XS
- **Risk**: LOW
- **Depends on**: 227 (partial — this can be done independently if 227 is not yet started)
- **Category**: tech-debt / clean-barrel
- **Generated at**: 2026-07-17

## Why this matters

`src/lib/services/search-service/index.ts` re-exports `__setDepsForTesting` from `./deps`. This test-only function propagates through the barrel chain (`search-service/index.ts` → `search-service.ts` → `services/index.ts`) and is visible to any consumer importing from `@/lib/services`. Test utilities should never be part of the public API. This is the same leak identified in Plan 226 with a smaller scope.

## Current state

`src/lib/services/search-service/index.ts:2`:

```ts
export { __setDepsForTesting } from "./deps";
```

This makes `__setDepsForTesting importable from `@/lib/services/search-service`and transitively from`@/lib/services/search-service.ts`.

## Target state

`__setDepsForTesting` is only importable by its absolute path (`@/lib/services/search-service/deps`), not through any barrel. Tests that need it import it directly from the deps module.

## Scope

- `src/lib/services/search-service/index.ts` — remove the re-export line
- All test files that currently import from `../index` or `../search-service` — update to import directly from `./deps`

## Steps

### 1. Remove re-export

In `src/lib/services/search-service/index.ts`, remove:

```ts
export { __setDepsForTesting } from "./deps";
```

### 2. Update test imports

Find test files importing `__setDepsForTesting`:

```bash
grep -r "__setDepsForTesting" src/lib/services/search-service/__tests__/
```

Update the import from:

```ts
import { __setDepsForTesting, searchAll } from "../index";
```

to:

```ts
import { __setDepsForTesting } from "../deps";
import { searchAll } from "../index";
```

### 3. Verify

- `pnpm run typecheck` — 0 errors
- `pnpm run test` — no regressions

Verification: `pnpm run typecheck ; pnpm run test`

## Stop conditions

- Any non-test file imports `__setDepsForTesting` — stop and verify it's not being used in production code

## Estimated time

10 minutes
