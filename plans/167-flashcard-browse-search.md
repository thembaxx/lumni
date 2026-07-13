---
status: TODO
priority: P1
effort: M
risk: MED
confidence: HIGH
created: 2026-07-12
commit: 4fcd46a4
---

# 167 — Flashcard browse re-reads entire table per keystroke

## Context

`src/app/[locale]/flashcards/browse/flashcard-browse-client.tsx` loads **all** flashcards via `flashcardEngine.getAll(subjectFilter)` and filters in JS inside a `useCallback` keyed on `[search, subjectFilter]`. The effect re-runs on every keystroke, so each character typed triggers a full Dexie `getAll()` + in-memory filter. On low-end Android with 1000+ cards (flagged USAB-01) this causes list jank.

## Current state (verified)

`src/app/[locale]/flashcards/browse/flashcard-browse-client.tsx:82-103`

```ts
const loadCards = useCallback(async () => {
  setStatus("loading");
  try {
    const all = await flashcardEngine.getAll(subjectFilter !== "all" ? subjectFilter : undefined);
    const filtered = search
      ? all.filter(
          (c) =>
            c.front.toLowerCase().includes(search.toLowerCase()) ||
            c.back.toLowerCase().includes(search.toLowerCase()),
        )
      : all;
    setCards(filtered);
    const uniqueSubjects = [...new Set(all.map((c) => c.subject))].toSorted();
    setSubjects(uniqueSubjects);
  } finally {
    setStatus("idle");
  }
}, [search, subjectFilter]);

useEffect(() => {
  loadCards();
}, [loadCards]); // fires on every keystroke
```

## Goal

Avoid re-fetching the whole table on each keystroke: fetch once per `subjectFilter` change, and debounce the in-memory filter on `search` changes.

## Steps

1. Split the two concerns:
   - Keep a `useEffect` that reloads `all` **only when `subjectFilter` changes** (dependency `[subjectFilter]`), storing `all` in a ref or state.
   - Apply the `search` filter in a separate `useMemo` (or debounced effect) over the already-loaded `all`, so typing only re-filters locally — no new `getAll()`.
2. Add a small debounce (e.g. 200ms) on the `search` value feeding the filter (the repo already uses `useMemo`/debounce patterns elsewhere — search for an existing `useDebounce` hook to reuse).
3. Keep `subjects` derived from the loaded `all` (now computed when `subjectFilter` changes).
4. Preserve `PAGE_SIZE` client pagination (`cards.slice(page * PAGE_SIZE, ...)`) — operates on the filtered array as before.
5. Run `pnpm exec oxfmt --check`.

## Scope

- In scope: `src/app/[locale]/flashcards/browse/flashcard-browse-client.tsx`.
- Out of scope: `flashcardEngine.getAll` server-side query capability (separate optimization), other browse pages.

## Done criteria

- `pnpm run typecheck` → 0 errors.
- `pnpm exec oxlint` → 0 warnings on changed file.
- `pnpm exec oxfmt --check` → clean.
- `pnpm exec vitest run src/app` (or component test if present) → pass; manual: typing in the search box no longer triggers network/indexedDB reads per keystroke (verify via DevTools/IndexedDB call count).

## Test plan

- If a component test exists for this file (`src/app/[locale]/flashcards/browse/__tests__/*`), extend it to assert `flashcardEngine.getAll` is called once per subject change, not per keystroke (spy on `getAll`).
- Otherwise add a lightweight test rendering the component with a mocked `flashcardEngine` and simulating two keystrokes, asserting `getAll` call count === 1.

## Maintenance

- If `flashcardEngine` later gains a server-side `search` query, prefer that over in-memory filtering; this plan's local-filter approach remains correct as a fallback.

## Escape hatches

- If no `useDebounce` hook exists, implement a tiny local debounce (setTimeout + clear) — do not add a new dependency.
