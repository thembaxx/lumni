# Plan 050: Fix mutable \_deps DI pattern in 26+ lib modules

> **Executor instructions**: Follow this plan step by step. Run every
> verification command. Drift check first:
> `git diff --stat 7525d6ed..HEAD -- src/lib/question-engine/enrichment-pipeline.ts src/lib/services/search-service.ts`

## Status

- **Priority**: P2
- **Effort**: L (multi-day; this is a codebase-wide refactor)
- **Risk**: MED (many consumers mock `_deps` in tests — must update tests in lockstep)
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

26+ lib modules and 7 hooks use a mutable module-level `_deps` pattern:

```typescript
let _deps: SomeDeps = DEFAULT_DEPS;
export function __setDepsForTesting(deps: SomeDeps) {
  _deps = deps;
}
```

This causes test-pollution (state leaks between test cases), circumvents proper constructor DI, and bloats public API surfaces with test-only exports. Modules using this pattern are harder to compose and reason about.

## Current state

All 26+ modules follow the same template. Example from `src/lib/services/search-service.ts:18-26`:

```typescript
type SearchDb = Pick<DataAccess, "questions" | "wrongAnswers" | ...>;
const DEFAULT_DEPS = { db: dexieDataAccess as SearchDb };
let _deps: { db: SearchDb } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: SearchDb }) {
  _deps = deps;
}
```

Other affected modules (sample): enrichment-pipeline.ts, chat-context.ts, observability/events.ts, exam-dates/service.ts, share-service.ts, retention-loop/next-action.ts, knowledge-graph/service.ts, vocabulary/service.ts, competitions/service.ts, pronunciation-history/service.ts, integration/service.ts, sync/sync-handler.ts, tinyfish/cache.ts, notification-service.ts, and 7+ hooks.

The repo convention for classes is proper constructor DI (see `PushDeliveryService` and `GamificationService`).

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

This plan is too large for a single executor session. It defines the PATTERN to follow, and lists 5 modules as a pilot. Expand to remaining 21+ modules in subsequent sessions.

**In scope (pilot)**:

- `src/lib/services/search-service.ts`
- `src/lib/tinyfish/cache.ts`
- `src/lib/exam-dates/service.ts`
- `src/lib/retention-loop/next-action.ts`
- `src/lib/sync/sync-handler.ts`

**Out of scope (deferred)**:

- The remaining 21+ modules
- Any hook files (different pattern — they use `_deps` from context providers)
- Test files that mock `_deps` (must be updated in lockstep, covered in Step 3)

## Steps (apply to each of the 5 pilot modules)

### Step 1: Convert module-level functions to a class

For each pilot module, determine the usage pattern:

**If the module exports standalone functions that call `_deps`** (like `search-service.ts`):
Wrap them in a class:

```typescript
// BEFORE (search-service.ts)
const DEFAULT_DEPS = { db: dexieDataAccess as SearchDb };
let _deps = DEFAULT_DEPS;

export function __setDepsForTesting(deps) { _deps = deps; }

export async function searchAll(query, ...) {
  await _deps.db.questions.toArray(); // ...
}
```

```typescript
// AFTER
export class SearchService {
  constructor(private deps: { db: SearchDb } = { db: dexieDataAccess as SearchDb }) {}

  async searchAll(query: string, ...) {
    await this.deps.db.questions.toArray();
    // ...
  }
}

// Singleton for production use
export const searchService = new SearchService();

// Re-export for backward compatibility
export const { searchAll, searchByType, searchDexieQuestions } = searchService;
```

**If the module is used as a service** (like `exam-dates/service.ts`):
Convert `let _deps` to a constructor parameter on the existing class.

### Step 2: Update all callers

For each converted module, update imports:

- `import { searchAll } from "@/lib/services/search-service"` still works if you re-export
- OR: `import { searchService } from "@/lib/services/search-service"`

Use `pnpm exec grep -rn "from \"@/lib/services/search-service\"" src/` to find all callers.

**Verify after each module**: `pnpm run typecheck` → exit 0.

### Step 3: Update test files

For each module's test file:

- Remove calls to `__setDepsForTesting()`
- Replace with constructor injection: `new SearchService({ db: mockDb })`
- If tests need to reset state between cases, create a new instance for each test

```typescript
// BEFORE
import { __setDepsForTesting } from "../search-service";

beforeEach(() => {
  __setDepsForTesting({ db: mockDb });
});
```

```typescript
// AFTER
import { SearchService } from "../search-service";

let service: SearchService;

beforeEach(() => {
  service = new SearchService({ db: mockDb });
});
```

**Verify**: `pnpm run test` → all pass.

### Step 4: Remove the \_\_setDepsForTesting export

After all callers and tests are updated, remove the `__setDepsForTesting` function and `let _deps` from each module.

**Verify**: `pnpm exec grep -rn "__setDepsForTesting" src/` returns zero results for the migrated modules.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] All 5 pilot modules have no `let _deps` or `__setDepsForTesting` pattern
- [ ] All existing callers of the 5 modules still work (backward-compat re-exports if needed)
- [ ] `plans/README.md` status row updated

## STOP conditions

- A module's callers are deeply spread across the codebase (>20 import sites) — consider deferring that module to a separate plan
- A module's tests heavily depend on `__setDepsForTesting` for module-level state — this is the exact pollution this plan fixes, but may need careful test-by-test migration
- A module re-exports `_deps` type publicly and removing it breaks a consumer

## Maintenance notes

- After migration, adding new consumers requires constructor injection, not a new `__setDepsForTesting` export.
- The singleton pattern (`export const searchService = new SearchService()`) is fine for production but tests should always create fresh instances.
- Future modules should never use the `_deps + __setDepsForTesting` pattern. This is the architectural standard going forward.
