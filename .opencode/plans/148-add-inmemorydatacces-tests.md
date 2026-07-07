# Plan 148: Add InMemoryDataAccess unit tests

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/lib/db/in-memory-data-access.ts`

## Status

- **Priority**: P1 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: test
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

`InMemoryDataAccess` is the test double used by every service's unit tests (CompetencyService, FlashcardEngine, AnalyticsEngine, etc.). If it has bugs, all tests that use it are unreliable. Currently it has zero tests of its own.

## Current state

- `src/lib/db/in-memory-data-access.ts` — ~200 lines of Map-backed DataAccess implementation
- Multiple services depend on it for tests
- No test file for it

## Steps

### Step 1: Create test file

Create `src/lib/db/__tests__/in-memory-data-access.test.ts`.

### Step 2: Write tests covering all query methods

Test each `DataAccessTable` method:

1. **put / get** — put a row, get it back by ID
2. **put / update** — put same ID twice, get updated value
3. **get missing** — get non-existent ID returns undefined
4. **bulkPut** — put multiple, getAll returns all
5. **delete** — put then delete, get returns undefined
6. **delete missing** — delete non-existent ID does not throw
7. **clear** — put multiple, clear, getAll returns empty

### Step 3: Write tests covering collection queries

Test `Collection<T>` methods:

1. **toArray** — returns all matching rows
2. **filter** — filters correctly
3. **sortBy** — sorts ascending
4. **limit** — limits to N
5. **offset** — skips first N
6. **first** — returns first match
7. **last** — returns last match
8. **modify** — batch update

### Step 4: Write tests covering WhereClause

Test `WhereClause<T>` methods:

1. **equals** (single field)
2. **above** / **below**
3. **between** / **startsWith**
4. **notEqual** / **inAnyRange**
5. Missing field query returns empty

### Step 5: Write edge-case tests

1. **Empty table** — where().filter().limit() on empty table
2. **Large dataset** — 10,000 rows, verify .limit(100).toArray() returns 100
3. **Stale data** — table is mutated between queries, second query reflects mutation

### Step 6: Verify

`pnpm test` → new tests pass. `pnpm typecheck` → exit 0.

## Done criteria

- [ ] `pnpm test` passes (20+ new test cases)
- [ ] `pnpm typecheck` exits 0
- [ ] All DataAccessTable methods covered
- [ ] All Collection methods covered
- [ ] All WhereClause methods covered
- [ ] Edge cases covered

## STOP conditions

If the InMemoryDataAccess API has changed, adjust test cases to match the current API surface.
