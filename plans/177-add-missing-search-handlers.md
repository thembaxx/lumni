# Plan 177: Add Missing Search Handlers for Pronunciation History and Knowledge Graph

> **Executor instructions**: Follow this plan step by step. Run every verification command and confirm the expected result before moving to the next step. If anything in the "STOP conditions" section occurs, stop and report — do not improvise. When done, update the status row for this plan in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 409ce60c..HEAD -- src/lib/services/search-service/`
> If any in-scope file changed since this plan was written, compare the "Current state" excerpts against the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `409ce60c`, 2026-07-15
- **Issue**: (none)

## Why this matters

The unified dashboard search handles 12 data types (questions, wrong-answers, flashcards, notes, study-guides, dictionary, stories, etc.) but misses pronunciation history and knowledge graph. Users can't search for words they've practiced pronunciation for, or find topic knowledge graphs. Each missing handler is ~15 lines following an existing pattern.

## Current state

In `src/lib/services/search-service/index.ts`, `searchAll()` enumerates handlers in parallel. `src/lib/services/search-service/handlers.ts` defines individual search handlers. Missing: `searchDexiePronunciationHistory`, `searchDexieKnowledgeGraph`.

Existing pattern (follow this exactly for the new handlers) — previous handlers look like:

```typescript
// From handlers.ts
export const searchDexieNotes = createSearchHandler<DbNote>(
  (db) => db.notes,
  (item, query) =>
    item.title.toLowerCase().includes(query) || item.content?.toLowerCase().includes(query),
);
```

## Commands you will need

| Purpose   | Command                  | Expected on success |
| --------- | ------------------------ | ------------------- |
| Install   | `pnpm install`           | exit 0              |
| Typecheck | `pnpm run typecheck`     | exit 0, no errors   |
| Tests     | `pnpm run test -- --run` | all pass            |
| Lint      | `pnpm exec oxlint --fix` | exit 0              |

## Scope

**In scope**:

- `src/lib/services/search-service/handlers.ts` — add 2 new handlers
- `src/lib/services/search-service/index.ts` — register new handlers in `searchAll()` and `SEARCH_HANDLERS`

## Steps

### Step 1: Add `searchDexiePronunciationHistory` handler

In `src/lib/services/search-service/handlers.ts`, add a new search handler for pronunciation history:

```typescript
export const searchDexiePronunciationHistory = createSearchHandler<PronunciationHistoryEntry>(
  (db) => db.pronunciationHistory,
  (item, query) =>
    item.word.toLowerCase().includes(query) || item.phoneticScore?.toString().includes(query),
);
```

Check the actual type name of pronunciation history entries in `src/lib/db/schema.ts` and the DataAccess accessor name.

### Step 2: Add `searchDexieKnowledgeGraph` handler

In `src/lib/services/search-service/handlers.ts`, add:

```typescript
export const searchDexieKnowledgeGraph = createSearchHandler<KnowledgeGraphEntry>(
  (db) => db.knowledgeGraph,
  (item, query) =>
    item.subject?.toLowerCase().includes(query) || item.topic?.toLowerCase().includes(query),
);
```

### Step 3: Register in `searchAll()` and `SEARCH_HANDLERS`

In `src/lib/services/search-service/index.ts`, find the `searchAll()` parallel array and add:

```typescript
searchDexiePronunciationHistory(db, query),
searchDexieKnowledgeGraph(db, query),
```

And in the `SEARCH_HANDLERS` map, add entries for the new handlers.

**Verify**: `rg "pronunciationHistory" src/lib/services/search-service/` → 2+ matches (handler + registration)
**Verify**: `rg "knowledgeGraph" src/lib/services/search-service/` → 2+ matches

### Step 4: Run all verification gates

**Verify**: `pnpm run typecheck` → exit 0, no errors
**Verify**: `pnpm run test -- --run` → all pass
**Verify**: `pnpm exec oxlint --fix` → exit 0

## Test plan

Existing search tests should pass. If there's a test that explicitly enumerates search handlers, add the two new ones to the expected list.

## Done criteria

- [ ] `pnpm run typecheck` exits 0
- [ ] `pnpm run test` exits 0
- [ ] `searchDexiePronunciationHistory` exists and is registered
- [ ] `searchDexieKnowledgeGraph` exists and is registered
- [ ] No files outside the in-scope list are modified
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- The DataAccess doesn't have `pronunciationHistory` or `knowledgeGraph` accessors
- The search handler type/pattern differs from the excerpt
- A step's verification fails twice after a reasonable fix attempt

## Maintenance notes

If new Dexie tables are added in the future, they should get a search handler for dashboard discoverability. The `createSearchHandler` pattern makes this trivial.
