# Plan 154: Add input debounce to dashboard SearchWidget + dedupe searchAll results

> **Executor instructions**: Follow this plan step by step.
> **Drift check**: `git diff --stat 649afc3b..HEAD -- src/components/dashboard/search-widget.tsx src/lib/search/`

## Status

- **Priority**: P2 | **Effort**: S | **Risk**: LOW | **Depends on**: none | **Category**: perf
- **Planned at**: commit `649afc3b`, 2026-07-07

## Why this matters

The SearchWidget fires `searchAll()` on every keystroke. For users with large datasets (hundreds of flashcards, notes, questions), this creates 20+ Dexie queries per search session. Adding a 300ms debounce reduces this to 2-3 queries per search. Additionally, `searchAll` may return duplicate results across tables that are not deduplicated before rendering.

## Current state

- `src/components/dashboard/search-widget.tsx` — calls `searchAll()` in onChange of the input
- `src/lib/search/chunked-search.ts` — likely fires parallel Dexie queries
- No debounce on the search input
- Results from different tables (questions, wrongAnswers, flashcards, notes) may overlap

## Steps

### Step 1: Add debounce to SearchWidget

```typescript
import { debounce } from "@/lib/shared/debounce";
// or implement inline:
const [query, setQuery] = useState("");
const debouncedQuery = useDeferredValue(query, 300); // React 19 useDeferredValue
// Or use a simple timeout pattern
```

The simplest approach: keep the input value in local state, and fire searchAll only from a `useEffect` that depends on `debouncedQuery`:

```typescript
const [inputValue, setInputValue] = useState("");
const [debouncedValue, setDebouncedValue] = useState("");

useEffect(() => {
  const timer = setTimeout(() => setDebouncedValue(inputValue), 300);
  return () => clearTimeout(timer);
}, [inputValue]);

useEffect(() => {
  if (debouncedValue.length >= 2) {
    searchAll(debouncedValue);
  }
}, [debouncedValue]);
```

### Step 2: Deduplicate search results

In `searchAll` or in the SearchWidget consumer, deduplicate by ID + type:

```typescript
const seen = new Set<string>();
const deduped = results.filter((r) => {
  const key = `${r.type}-${r.id}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
```

### Step 3: Add search-query test

Write tests verifying:

- Input under 2 chars does not fire searchAll
- Debounce waits ~300ms before firing
- Duplicate results are removed from final output

### Step 4: Verify

`pnpm typecheck` → exit 0. `pnpm test` → all pass.

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test` passes
- [ ] Search input has 300ms debounce before firing queries
- [ ] Search results deduplicated by type+id
- [ ] Queries not fired for inputs < 2 chars

## STOP conditions

If React 19's `useDeferredValue` is already imported/used elsewhere, prefer that over manual setTimeout. Read the existing hook patterns to decide.
