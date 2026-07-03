# Plan 082: Add Afrikaans/isiZulu/isiXhosa Wiktionary support to dictionary

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 44169e58..HEAD -- src/lib/dictionary/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `44169e58`, 2026-07-03

## Why this matters

The dictionary service works well for English (querying `en.wiktionary.org`) but is hardcoded to a single Wiktionary API URL. The ROADMAP.md explicitly calls for Afrikaans, isiZulu, and isiXhosa word lookups. The Wiktionary API supports per-language subdomains (`af.wiktionary.org`, `zu.wiktionary.org`, `xh.wiktionary.org`) with the same API format — the change is purely about URL selection. With South Africa's 11 official languages and a target user base that speaks these at home, this unlocks the dictionary for students who need lookups in their home language.

## Current state

- `src/lib/dictionary/wiktionary-service.ts:6` — Hardcoded to English only:

  ```ts
  const EN_WIKTIONARY_API = "https://en.wiktionary.org/w/api.php";
  ```

  All requests go to this single URL regardless of the `language` parameter.

- `src/lib/dictionary/service.ts` — The `lookupWord` function receives a `language` parameter and passes it through to `lookupWiktionary`. The wiktionary-service ignores it.

- `src/lib/dictionary/types.ts` — `DictionaryResult` interface includes `language: string` field already.

- `src/lib/dictionary/__tests__/service.test.ts` — 6 existing tests covering English lookups.

Wiktionary subdomain pattern:

- English: `en.wiktionary.org`
- Afrikaans: `af.wiktionary.org`
- isiZulu: `zu.wiktionary.org`
- isiXhosa: `xh.wiktionary.org`
- Sesotho: `st.wiktionary.org`
- Setswana: `tn.wiktionary.org`
- Sepedi: `nso.wiktionary.org`
- Xitsonga: `ts.wiktionary.org`
- siSwati: `ss.wiktionary.org`
- Tshivenda: `ve.wiktionary.org`
- isiNdebele: `nd.wiktionary.org`

Relevant conventions:

- Error handling uses `logError()` from `@/lib/shared/logger` — never silent catches.
- The function should fall back to English Wiktionary when the specific language Wiktionary is unavailable or returns no results.
- See `src/lib/dictionary/wiktionary-service.ts` for the existing API call pattern.

## Commands you will need

| Purpose   | Command                   | Expected on success |
| --------- | ------------------------- | ------------------- |
| Install   | `pnpm install`            | exit 0              |
| Typecheck | `pnpm typecheck`          | exit 0, no errors   |
| Tests     | `pnpm test -- dictionary` | all pass            |
| Lint      | `pnpm lint`               | exit 0              |

## Scope

**In scope** (the only files you should modify):

- `src/lib/dictionary/wiktionary-service.ts` — add language-to-subdomain mapping and fallback logic
- `src/lib/dictionary/__tests__/wiktionary-service.test.ts` — new: language-specific tests (create)

**Out of scope** (do NOT touch):

- `src/lib/dictionary/service.ts` — no changes needed; it already passes the language parameter
- `src/lib/dictionary/types.ts` — interface is adequate
- `src/components/dictionary/` — no UI changes
- Any other module

## Git workflow

- Branch: `advisor/082-wiktionary-sa-languages`
- Commits: one per step, conventional message style
- Do NOT push or open a PR

## Steps

### Step 1: Add language-to-subdomain mapping

In `src/lib/dictionary/wiktionary-service.ts`:

1. Replace the hardcoded `EN_WIKTIONARY_API` constant with a language-aware URL builder:

```ts
const WIKTIONARY_SUBDOMAINS: Record<string, string> = {
  en: "en",
  af: "af",
  zu: "zu",
  xh: "xh",
  st: "st",
  tn: "tn",
  nso: "nso",
  ts: "ts",
  ss: "ss",
  ve: "ve",
  nd: "nd",
};

function getWiktionaryApiUrl(language: string): string {
  const subdomain = WIKTIONARY_SUBDOMAINS[language] ?? "en";
  return `https://${subdomain}.wiktionary.org/w/api.php`;
}
```

2. Update the `lookupWiktionary` function signature to accept an optional `language` parameter (defaulting to `"en"`):

```ts
export async function lookupWiktionary(
  word: string,
  language: string = "en",
): Promise<DictionaryResult | null> {
```

3. Use `getWiktionaryApiUrl(language)` instead of the hardcoded constant for the API URL.

4. Add fallback logic: if the language-specific API returns no results (empty `query.pages`), retry with `language = "en"`:

```ts
const apiUrl = getWiktionaryApiUrl(language);
const data = await fetchWiktionaryApi(apiUrl, word);

if (!data?.query?.pages || Object.keys(data.query.pages).length === 0) {
  if (language !== "en") {
    // Fall back to English Wiktionary
    const fallbackUrl = getWiktionaryApiUrl("en");
    const fallbackData = await fetchWiktionaryApi(fallbackUrl, word);
    if (fallbackData) {
      const result = parseWiktionaryResponse(fallbackData);
      if (result) {
        result.language = language; // Keep the original requested language
        return result;
      }
    }
  }
  return null;
}
```

5. Extract the fetch-and-parse logic into a helper `fetchWiktionaryApi(url, word)` to avoid duplication between the primary and fallback paths.

**Verify**: `pnpm typecheck` exits 0.

### Step 2: Update the exported function and verify it's called correctly

Ensure that `lookupWiktionary` is called with the language parameter everywhere it's invoked:

- `src/lib/dictionary/service.ts` — check that the `language` parameter from `lookupWord(word, language)` is forwarded to `lookupWiktionary(word, language)`.
- If the language parameter isn't forwarded, fix it.

**Verify**: `pnpm typecheck` exits 0.

### Step 3: Write tests

Create `src/lib/dictionary/__tests__/wiktionary-service.test.ts` with:

1. **URL construction**: Test that `getWiktionaryApiUrl("af")` returns `https://af.wiktionary.org/w/api.php`, `getWiktionaryApiUrl("zu")` returns `https://zu.wiktionary.org/w/api.php`, and unknown language codes fall back to English.

2. **Fallback behavior**: Test that when the primary language Wiktionary returns empty results, the service falls back to English and returns a result.

3. **English default**: Test that calling without a language parameter defaults to English.

Use `vi.mock` to mock the fetch calls. Follow the test pattern from `src/lib/dictionary/__tests__/service.test.ts` for the mock approach.

**Verify**: `pnpm test -- dictionary` exits 0 with all 6+ tests passing.

## Test plan

- New test file: `src/lib/dictionary/__tests__/wiktionary-service.test.ts`
- Tests:
  1. URL construction for each SA language code
  2. Fallback to English when language wiktionary returns empty
  3. Returns non-null result on success
- All existing dictionary tests should still pass

## Done criteria

- [ ] `pnpm typecheck` exits 0
- [ ] `pnpm test -- dictionary` exits 0 (all tests pass)
- [ ] `pnpm lint` exits 0
- [ ] `pnpm test` exits 0 overall
- [ ] No files outside the in-scope list are modified (`git status`)
- [ ] `plans/README.md` status row updated

## STOP conditions

- If the `lookupWiktionary` function signature has changed since this plan was written, stop and report.
- If the Wiktionary API has changed (breaking), stop and report.
- If a SA language subdomain doesn't exist on Wiktionary, that's expected — the fallback handles it gracefully. Do NOT file issues about missing subdomains.

## Maintenance notes

- The `WIKTIONARY_SUBDOMAINS` map can be expanded with more language codes as needed.
- Wiktionary's API is the same across all subdomains — if the API changes, the update applies uniformly.
- The in-language result may have fewer definitions than the English fallback. That's expected — students will get the best available result.
- No rate limiting is implemented — if Wiktionary blocks based on request volume, add a simple retry-with-backoff.
