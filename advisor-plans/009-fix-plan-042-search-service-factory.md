# Advisor Plan 009: Implement Plan 042 — Consolidate search-service.ts 12x copy-paste

> **Source**: Audit finding ARCH-03 — Plan 042 was marked DONE but never implemented
> **Priority**: P2
> **Effort**: M
> **Risk**: LOW (pure data mapping, no side effects, no auth)
> **Confidence**: HIGH

## Why this matters

Plan 042 was supposed to be implemented as part of Batch 2 (June 2026) but **the file was never changed**. `src/lib/services/search-service.ts` still has 12 individual near-identical search functions (488 lines total) — each 30-60 lines following the exact same pattern: `toArray() → textRelevant(query) → map to SearchResultItem → slice(0, 10)`. The plan status says "DONE (APPROVED)" but the code was never modified.

This is one of the highest-leverage refactors in the codebase:

- ~400 lines of copy-paste → ~200 lines with factory
- Adding a new searchable table requires one line instead of ~40 lines
- Bug fixes (limit, relevance scoring) apply everywhere automatically

## Current state

Confirmed: `src/lib/services/search-service.ts` is 488 lines with 12 individual functions (lines 59-397), no factory pattern. See audit evidence.

## Plan (directly adapted from Plan 042)

### Step 1: Create factory function

At the top of `search-service.ts`, create a generic table search factory:

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
      if (item && itemMatchesQuery(item, query)) results.push(item);
    }
    return results.slice(0, 10);
  };
}
```

### Step 2: Add `itemMatchesQuery` helper

The `textRelevant()` function already exists. Use it in the factory:

```typescript
function itemMatchesQuery(item: SearchResultItem, query: string): boolean {
  // Each table's mapper decides which fields to match via textRelevant
  // The factory just checks if the mapper returned a non-null item
  // (the `toItem` mapper already filters by relevance)
  return true; // Filtering happens inside toItem
}
```

Actually simpler: make `toItem` return `null` when no match, `SearchResultItem` when match. The factory skips nulls.

### Step 3: Replace all 12 functions

```typescript
const searchDexieQuestions = createTableSearch("questions", (row) => {
  const questions: Array<{ id: string; questionText: string; topic: string }> = JSON.parse(
    (row.questions as string) || "[]",
  );
  for (const q of questions) {
    if (textRelevant(q.questionText, query)) {
      return {
        id: `q-${q.id}`,
        type: "question" as const,
        title: q.questionText.slice(0, 120),
        snippet: q.questionText,
        subject: row.subject as string,
        topic: q.topic || (row.topic as string),
        createdAt: row.cachedAt as number,
      };
    }
  }
  return null;
});
```

Wait — `createTableSearch` needs to pass `query` to `toItem`. Let me rethink:

```typescript
function createTableSearch<T extends Record<string, unknown>>(
  table: TableName,
  toItems: (row: T, query: string) => SearchResultItem | null,
): (query: string) => Promise<SearchResultItem[]> {
  return async (query: string) => {
    const rows = await (_deps.db[table] as unknown as { toArray(): Promise<T[]> }).toArray();
    const results: SearchResultItem[] = [];
    for (const row of rows) {
      const item = toItems(row, query);
      if (item) results.push(item);
    }
    return results.slice(0, 10);
  };
}
```

Then each search function:

```typescript
const searchDexieWrongAnswers = createTableSearch("wrongAnswers", (row, query) => {
  if (
    textRelevant(row.questionText as string, query) ||
    textRelevant(row.correctAnswer as string, query) ||
    textRelevant((row.explanation as string) || "", query)
  ) {
    return {
      id: `wa-${row.id}`,
      type: "wrong-answer" as const,
      title: (row.questionText as string).slice(0, 120),
      snippet: `${(row.correctAnswer as string).slice(0, 100)}...`,
      subject: row.subject as string,
      topic: row.topic as string,
      createdAt: row.createdAt as number,
    };
  }
  return null;
});
```

### Step 4: Simplify `searchByType` switch

Replace the switch with a `Record` lookup:

```typescript
const SEARCH_HANDLERS: Record<string, (query: string) => Promise<SearchResultItem[]>> = {
  question: searchDexieQuestions,
  "wrong-answer": searchDexieWrongAnswers,
  flashcard: searchDexieFlashcards,
  note: searchLocalStorageNotes,
  "quiz-attempt": searchDexieQuizAttempts,
  "exam-session": searchDexieExamSessions,
  progress: searchDexieProgress,
  "study-guide": searchDexieStudyGuides,
  dictionary: searchDexieDictionary,
  story: searchDexieStories,
  lesson: searchDexieLessons,
  vocabulary: searchDexieVocabulary,
};

function searchByType(query: string, type: SearchResultItem["type"]): Promise<SearchResultItem[]> {
  const handler = SEARCH_HANDLERS[type];
  if (!handler) return Promise.resolve([]);
  return handler(query);
}
```

### Step 5: Preserve `searchLocalStorageNotes` as-is

This function reads from localStorage, not Dexie. Keep it unchanged.

## Verification

- `pnpm run typecheck` → exit 0
- `pnpm run test` → all pass (existing search tests)
- File reduced from ~488 lines to ~250 lines

## Done criteria

- [ ] 12 individual search functions replaced by factory invocations
- [ ] `searchLocalStorageNotes` preserved as-is
- [ ] `searchByType` switch replaced with `Record` lookup
- [ ] `pnpm run typecheck` exits 0
