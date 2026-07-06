# Plan 112: Add characterization tests for Dexie schema (778 lines, highest churn)

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat d3446bd7..HEAD -- src/lib/db/schema.ts`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MEDIUM (tests run in fake-indexeddb; if fake-indexeddb doesn't
  perfectly emulate Dexie, tests may give false confidence)
- **Depends on**: none
- **Category**: tests
- **Planned at**: commit `d3446bd7`, 2026-07-06

## Why this matters

`src/lib/db/schema.ts` (778 lines) defines 35+ Dexie tables across 12 schema
versions (v35→v46). It is the highest-churn file in the codebase. A single
typo in a schema string — missing index, wrong compound key syntax, wrong
version number — silently corrupts offline data for all users who visit the
app. There is zero test coverage.

IndexedDB schema migrations are irreversible on the client. A broken migration
cannot be rolled back once users have opened the app.

## Current state

- `src/lib/db/schema.ts:502-693` — `LumniOfflineDB` class with 71 table
  declarations and version blocks v35 through v46
- `src/lib/db/schema.ts:778` — `export const offlineDB = createOfflineDBProxy()`
- `src/lib/db/__tests__/000_schema.test.ts` — 7 existing tests that verify
  table names and schema version but do NOT test migration chains, compound
  indexes, or data integrity across versions
- `fake-indexeddb` npm package is already available in the repo (check
  `package.json` or `node_modules/`)

## Commands you will need

| Purpose   | Command                                  | Expected on success |
| --------- | ---------------------------------------- | ------------------- |
| Install   | `pnpm install`                           | exit 0              |
| Typecheck | `pnpm run typecheck`                     | exit 0              |
| Tests     | `pnpm run test`                          | all pass            |
| Specific  | `pnpm run test -- src/lib/db/__tests__/` | all pass            |

## Scope

**In scope**:

- `src/lib/db/__tests__/schema-migration.test.ts` — create new test file

**Out of scope**:

- Changes to `schema.ts` itself (tests only)
- Adding `fake-indexeddb` (check if it's already a dependency first)

## Steps

### Step 1: Check if fake-indexeddb is available

```bash
pnpm ls fake-indexeddb 2>/dev/null || echo "not found"
```

If not found, install:

```bash
pnpm add -D fake-indexeddb
```

### Step 2: Create the test file

Create `src/lib/db/__tests__/schema-migration.test.ts` with the following
test groups:

**Group 1: Version chain runs without error (smoke test)**

Create a test that:

1. Imports `LumniOfflineDB` from `@/lib/db/schema`
2. Instantiates it with a unique database name (use `crypto.randomUUID()`)
3. Opens the database at the latest version
4. Asserts `db.isOpen()` returns true
5. Closes and deletes the database

Use this pattern (adapt as needed for `fake-indexeddb`):

```ts
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { LumniOfflineDB } from "@/lib/db/schema";

describe("Dexie schema migration", () => {
  let db: LumniOfflineDB;

  afterAll(async () => {
    if (db?.isOpen()) {
      db.close();
      await db.delete();
    }
  });

  it("opens at latest version without error", async () => {
    db = new LumniOfflineDB();
    await db.open();
    expect(db.isOpen()).toBe(true);
    expect(db.verno).toBe(46); // latest version number
  });
});
```

**Group 2: All table names are accessible**

After opening the database, verify that every expected table exists by checking
`db.tables.some(t => t.name === tableName)`.

Expected tables (from `src/lib/db/__tests__/000_schema.test.ts`):
Include all 23+ table names listed in that file.

**Group 3: Compound indexes parse correctly**

For each table with compound indexes (check `schema.ts` for index definitions
using `&` unique or `*` multi-entry), verify that calling
`db.table("name").where({ key1: "val1", key2: "val2" })` doesn't throw.

**Group 4: Data round-trips through a table**

Pick 2-3 representative tables (e.g., `questions`, `flashcards`, `competencies`).
Insert a record, read it back, verify fields match. Delete the record.

### Step 3: Run tests

```bash
pnpm run test -- src/lib/db/__tests__/schema-migration.test.ts
```

Fix any test failures. Common issues:

- `fake-indexeddb` may need to be polyfilled via `globalThis` in the test
  setup — check `src/test-setup.ts` for existing polyfill patterns
- Dexie's `open()` may fail if `indexedDB` global is not set — use
  `fake-indexeddb` auto-polyfill or set it in `beforeAll`

### Step 4: Verify full test suite

```bash
pnpm run test
```

→ All existing tests plus the new migration tests pass.

## Test plan

| Test                                        | What it verifies                                         |
| ------------------------------------------- | -------------------------------------------------------- |
| `opens at latest version`                   | The schema version chain runs without error from v35→v46 |
| `all table names accessible`                | No table was accidentally dropped in a migration         |
| `compound indexes parse`                    | Multi-column indexes don't throw on query                |
| `data round-trips through questions table`  | Insert/read/delete works on `questions`                  |
| `data round-trips through flashcards table` | Insert/read/delete works on `flashcards`                 |

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test -- src/lib/db/__tests__/schema-migration.test.ts` — all new tests pass
- [ ] `pnpm run test` — all 1863+ tests pass
- [ ] Only the new test file is added (no modifications to schema.ts)
- [ ] `plans/README.md` status row updated

## STOP conditions

- `fake-indexeddb` is incompatible with the current Dexie version — check
  compatibility matrix; if blocked, switch to `dexie-mock` or manual
  `globalThis.indexedDB` mock
- More than 3 migration versions throw on open — the schema may already be
  broken; stop and report
- `pnpm run test` takes >5 minutes longer than before — investigate slow test

## Maintenance notes

- When a new Dexie schema version is added, this test file should be updated
  to expect the new version number and add any new table names to the list
- The migration test catches "silent schema corruption" bugs — it should run
  in CI as part of the unit-tests job
- Consider adding a data-preservation test for future schema changes: seed
  data at vN, run migration to vN+1, verify old data is still readable
