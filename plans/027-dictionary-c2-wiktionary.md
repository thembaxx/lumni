# Plan 027: Dictionary C2 — Wiktionary API for SA languages + Word of the Day

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none

## Why this matters

Dictionary only supports English (via `api.dictionaryapi.dev`). Afrikaans, isiZulu, and isiXhosa learners have no word lookup support. Wiktionary API (`en.wiktionary.org/w/api.php`) supports all SA languages. Adding it as a fallback bridge unlocks lookups for all 11 SA languages.

## Scope

**In scope**:

- `src/lib/dictionary/wiktionary-service.ts` — new Wiktionary lookup service
- `src/lib/dictionary/service.ts` — add Wiktionary fallback in lookupWord()
- `src/lib/dictionary/seed-words.ts` — add Afrikaans + isiZulu seed words
- `src/components/dashboard/word-of-day.tsx` — new component
- `src/app/[locale]/dashboard/dashboard-client.tsx` — wire Word of Day
- `src/lib/dictionary/` — add `getRandomWord()`, `getWordOfDay()`

**Out of scope**: Translation quality audit, full i18n of dictionary UI

## Steps

### Step 1: Create Wiktionary service

New file `src/lib/dictionary/wiktionary-service.ts`:

- Function: `lookupWiktionary(word: string, language: string): Promise<DictionaryResult | null>`
- Calls: `GET https://en.wiktionary.org/w/api.php?action=query&titles=${word}&prop=extracts&format=json&exintro=1&explaintext=1`
- Also fetch language-specific page: `https://${language}.wiktionary.org/w/api.php?action=query&titles=${word}&prop=extracts&format=json`
- Parse response to extract definitions, phonetic info, part of speech
- Cache in Dexie `dictionaryCache` with same 24h TTL
- Map to `DictionaryResult` format (compatible with existing consumer)

### Step 2: Add Wiktionary fallback in dictionary service

In `src/lib/dictionary/service.ts`, modify `lookupWord()`:

1. Try Free Dictionary API first (for English) — unchanged
2. If fail OR language is not "en": try Wiktionary API
3. If Wiktionary succeeds: cache and return
4. If both fail: return null

### Step 3: Add SA language seed words

In `seed-words.ts`, add:

- **Afrikaans** (50 words): common curriculum terms like rekeningkunde (accounting), wiskunde (mathematics), natuurwetenskap (natural science), etc.
- **isiZulu** (50 words): izibalo (mathematics), isayensi (science), ubuciko (arts), etc.

### Step 4: Create Word of the Day component

New file `src/components/dashboard/word-of-day.tsx`:

- Small card showing a featured word
- Word changes daily (deterministic: hash of date string selects from seed words)
- Shows: word, definition, part of speech, audio play button
- Uses existing `lookupWord()` for definition
- Click navigates to `/dictionary?q=...`

### Step 5: Wire into dashboard

In `dashboard-client.tsx`, add `<WordOfDayCard />` in an appropriate position (e.g., after the search widget or in a sidebar area).

### Step 6: Verify

```bash
npx tsc --noEmit
npx biome check src/lib/dictionary/ src/components/dashboard/word-of-day.tsx
bun run test
```

## Done criteria

- Afrikaans word lookup works via Wiktionary fallback
- isiZulu word lookup works via Wiktionary fallback
- English still uses Free Dictionary API (unchanged)
- Seed words added for Afrikaans + isiZulu
- Word of the Day card appears on dashboard
- All verification passes
