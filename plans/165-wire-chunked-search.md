---
status: TODO
priority: P1
effort: M
risk: MED
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 165 — Wire the orphaned `chunked-search.ts` into `searchAll`

## Context

`src/lib/search/chunked-search.ts` (added Session 28) implements parallel Dexie table queries with a **500ms timeout** and relevance scoring (exact > prefix > substring), designed exactly for the dashboard search. It has **zero importers** (verified: `grep -r chunked-search` returns nothing). Instead, `searchAll` in `src/lib/services/search-service/index.ts` runs 12 handlers in parallel, each doing a full `table.toArray()` and filtering in JS. On large datasets this is a major INP/TBT cost on the dashboard.

## Current state (verified)

`src/lib/services/search-service/index.ts:48-71` — `searchAll` calls `searchDexieQuestions`, `searchDexieWrongAnswers`, `searchDexieFlashcards`, `searchNotes`, `searchDexieQuizAttempts`, `searchDexieExamSessions`, `searchDexieProgress`, `searchDexieStudyGuides`, `searchDexieDictionary`, `searchDexieStories`, `searchDexieLessons`, `searchDexieVocabulary` — each a full-table scan.
`src/lib/search/chunked-search.ts` — exports a `searchInChunks(query, opts?)` (or similarly named) function with parallel queries + 500ms timeout + relevance scoring.

## Goal

Replace the full-table `searchAll` implementation with the existing `chunked-search` module (or adapt it to cover all 12 sources), keeping the same `SearchResultItem` output shape and the Appwrite fallback behavior.

## Steps

1. Read `src/lib/search/chunked-search.ts` fully and note its exported signature, the `SearchResultItem` mapping it expects, and how it queries Dexie.
2. Read `src/lib/services/search-service/handlers.ts` and `factory.ts` to see the current per-table `createTableSearch` and how each maps rows → `SearchResultItem`.
3. Decide integration approach:
   - **Preferred:** Extend `chunked-search.ts` (or wrap it) so it accepts the 12 table accessors (from `dexieDataAccess`) and the per-table row→`SearchResultItem` mappers from `handlers.ts`, preserving the 500ms timeout and relevance scoring. Then have `searchAll` call it.
   - Keep the early-exit (`if localResults.length >= 25 return`) and the `searchAppwrite` fallback (`index.ts:34-45, 69`).
4. Update `src/lib/services/search-service/index.ts` `searchAll` to use the chunked implementation; keep `searchByType` and `searchWeb` unchanged.
5. Ensure the `dexieDataAccess` import path matches the repo convention (`@/lib/db`).
6. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/lib/services/search-service/index.ts`, `src/lib/search/chunked-search.ts` (extend if needed), optionally `handlers.ts`/`factory.ts` for mappers.
- Out of scope: the 200ms debounce in `search-results.tsx` (UI-side, leave), flashcard browse (plan 167), Appwrite search route.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings on changed files.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/lib/services/search-service src/lib/search` → pass.
- Manual/CI: dashboard search still returns same result types for a query across all 12 sources.

## Test plan

- Add/extend a test in `src/lib/services/search-service/__tests__/*` (or `src/lib/search/__tests__/*`) that seeds `dexieDataAccess` (via `InMemoryDataAccess`, see plan 169 fix for seeding) with rows in 2–3 tables, runs `searchAll`, and asserts results from each seeded table are present and relevance-ranked. Mirror the existing search-service test patterns.

## Maintenance

- If a new search source is added later, register it in `chunked-search` (or `searchAll`) in one place. Keep the 500ms timeout as the bound.

## Escape hatches

- If `chunked-search.ts`'s signature is too divergent to wrap cleanly, implement the parallel-query-with-timeout logic directly inside `searchAll` (still reuse the relevance scoring) rather than forcing an awkward adapter. Do NOT delete `chunked-search.ts` unless fully replaced.
