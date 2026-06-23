# Plan 042: Consolidate search-service.ts 12x copy-paste into factory pattern

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 7525d6ed..HEAD -- src/lib/services/search-service.ts`
> If the file changed, compare excerpts before proceeding; on a mismatch, STOP.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW (pure data mapping, no side effects, no auth)
- **Depends on**: none
- **Category**: tech-debt
- **Planned at**: commit `7525d6ed`, 2026-06-23

## Why this matters

`search-service.ts` has 12 near-identical search functions (each 30–60 lines, total ~400 lines) following the exact same pattern: `toArray() → filter by textRelevant(query) → map to SearchResultItem → slice(0, 10)`. The only variations are the Dexie table accessor and the field mapping to `SearchResultItem`. Adding a new searchable table requires duplicating the entire template. Bug fixes (limit, relevance scoring) must be applied to all 12 copies.

## Current state

`src/lib/services/search-service.ts` has these 12 functions starting around line 59:

```typescript
function searchDexieQuestions(query: string): Promise<SearchResultItem[]> {
  return _deps.db.questions.toArray().then((rows) => {
    const results: SearchResultItem[] = [];
    for (const row of rows) {
      // ... map row to SearchResultItem
    }
    return results.slice(0, 10);
  });
}

function searchDexieWrongAnswers(query: string): Promise<SearchResultItem[]> {
  return _deps.db.wrongAnswers.toArray().then((rows) => {
    const results: SearchResultItem[] = [];
    for (const r of rows) {
      // ... same pattern, different fields
    }
    return results.slice(0, 10);
  });
}
// ... repeated 10 more times for: flashcards, quizAttempts, examSessions,
// progress, studyGuides, dictionaryCache, storyCache, lessonCache, vocabularyList
// plus searchLocalStorageNotes (localStorage, not Dexie)
```

Each follows the same shape: `_deps.db.<table>.toArray()` → loop over rows → `textRelevant(text, query)` → push `SearchResultItem` → `slice(0, 10)`.

The repo uses a `_deps` mutable DI pattern (module-level `let _deps = { db: dexieDataAccess as SearchDb }` with `__setDepsForTesting`). Keep this pattern.

## Commands you will need

| Purpose   | Command              | Expected on success |
| --------- | -------------------- | ------------------- |
| Typecheck | `pnpm run typecheck` | exit 0              |
| Tests     | `pnpm run test`      | all pass            |
| Lint      | `pnpm run lint`      | exit 0              |

## Scope

**In scope**:

- `src/lib/services/search-service.ts` — the entire file

**Out of scope**:

- `src/lib/services/__tests__/` — existing tests should still pass
- Any component or hook that calls `searchAll()` or `searchByType()` — their interface doesn't change
- The `SearchResultItem` type — keep it as-is

## Steps

### Step 1: Create a factory function

At the top of `search-service.ts` (or a new helper), create a generic table search factory:

```typescript
type TableName = keyof SearchDb;

function createTableSearch<T extends Record<string, unknown>>(
  table: TableName,
  toItem: (row: T) => SearchResultItem | null,
): (query: string) => Promise<SearchResultItem[]> {
  return async (query: string) => {
    const rows = await (_deps.db[table] as unknown as { toArray(): Promise<T[]> }).toArray();
    const results: SearchResultItem[] = [];
    for (const row of rows) {
      const item = toItem(row);
      if (item) results.push(item);
    }
    return results.slice(0, 10);
  };
}
```

**Verify**: `pnpm run typecheck` → the type assertions compile.

### Step 2: Replace the 12 individual functions with factory invocations

Replace each `function searchDexie<Table>(query: string): Promise<SearchResultItem[]> { ... }` with:

```typescript
const searchDexieQuestions = createTableSearch("questions", (row) => {
  const questions: Array<{ id: string; questionText: string; topic: string }> = JSON.parse(
    (row.questions as string) || "[]",
  );
  // yield one SearchResultItem per question in the batch
  // return null if no match
});

const searchDexieWrongAnswers = createTableSearch("wrongAnswers", (row) => ({
  id: `wa-${row.id}`,
  type: "wrong-answer" as const,
  title: (row.questionText as string).slice(0, 120),
  snippet: row.questionText as string,
  subject: row.subject as string,
  topic: row.topic as string,
  createdAt: row.createdAt as number,
}));

// ... same pattern for all 10 Dexie tables
```

**IMPORTANT**: Preserve the `searchLocalStorageNotes` function as-is (it reads localStorage, not Dexie). Don't try to force it into the factory.

**Verify**: After replacing each function, run `pnpm run typecheck`.

### Step 3: Simplify the `searchByType` switch

Replace the current switch statement at ~line 454 with a `Record` lookup:

```typescript
const SEARCH_HANDLERS: Record<string, (query: string) => Promise<SearchResultItem[]>> = {
  question: searchDexieQuestions,
  "wrong-answer": searchDexieWrongAnswers,
  flashcard: searchDexieFlashcards,
  note: searchLocalStorageNotes,
  // ...
};

function searchByType(type: string, query: string): Promise<SearchResultItem[]> {
  const handler = SEARCH_HANDLERS[type];
  if (!handler) return Promise.resolve([]);
  return handler(query);
}
```

**Verify**: `pnpm run typecheck` → exit 0.

### Step 4: Run tests

**Verify**: `pnpm run test` → all pass.

## Test plan

- Existing search tests must pass without changes (the public API of `searchAll`, `searchByType`, and each named function is unchanged).
- If `search-service.test.ts` exists with direct imports of individual `searchDexie*` functions, those imports should still work.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] The 12 individual search functions are replaced by factory invocations (or kept as re-exports from the factory)
- [ ] `searchLocalStorageNotes` is preserved as-is
- [ ] The `searchByType` switch is a `Record` lookup
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- The code at `search-service.ts:59-396` doesn't match the excerpts
- Any step's typecheck fails with errors not caused by the change
- A test that directly imports a `searchDexie*` function breaks (the function still exists, just created via factory)

## Maintenance notes

- Adding a new searchable table is now: add the table to `SearchDb` type, add a one-liner `createTableSearch(...)` call, add the handler to `SEARCH_HANDLERS`.
- The `limit(10)` is hardcoded in the factory. If different tables need different limits, add a `maxResults` parameter to `createTableSearch`.
- The `textRelevant()` function (simple `.includes()`) is unchanged. If relevance scoring is added later, it goes in `createTableSearch`'s mapper.
