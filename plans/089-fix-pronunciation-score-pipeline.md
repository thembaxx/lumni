# Plan 089: Fix pronunciation score pipeline to use phoneme accuracy

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat a72e64df..HEAD -- src/lib/audio-engine/whisper-service.ts src/lib/audio-engine/phoneme-service.ts src/lib/audio-engine/__tests__/`
> If any in-scope file changed, compare the "Current state" excerpts against
> the live code before proceeding; on a mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Planned at**: commit `a72e64df`, 2026-07-03

## Why this matters

The pronunciation feature records a student speaking, transcribes with Whisper, and shows an `overallScore` and per-word `accuracy` scores. But the scores measure **character-level exact match** (Levenshtein edit distance between transcribed text and expected text), not **pronunciation quality**. A student who says "think" as "thing" (voiced final consonant instead of unvoiced) gets a word accuracy of 0.6 (6 of 10 characters match), even though their _pronunciation_ of 9 of 10 phonemes was fine. Conversely, a student who says the exact right words but with a strong accent that flips a single phoneme loses the whole word.

The phoneme-level assessment (`assessPhonemes` via `phoneme-service.ts`) already computes `phonemeAccuracy` and `phonemeDetails` — but it's only attached to the return object, never used for the score that gets saved to `pronunciationHistory`. The trend charts and progress tracking are contaminated.

This was identified in the original Pronunciation C1 plan (plan 030) but the phoneme service was built without wiring the score pipeline.

## Current state

- `src/lib/audio-engine/whisper-service.ts:153-184` — `assessPronunciation()`:

  ```ts
  // Line 167: overallScore = correct words / total words (character exact match)
  const overallScore =
    wordScores.length > 0 ? Math.round((correctCount / wordScores.length) * 100) : 0;

  // Line 170: phonemeAccuracy computed but unused for scoring
  const { phonemeAccuracy, phonemeDetails } = assessPhonemes(studentText, expectedText);
  ```

- `src/lib/audio-engine/phoneme-service.ts:339` — `assessPhonemes()` returns `{ phonemeAccuracy: number, phonemeDetails: PhonemeDetail[] }`
- Pronunciation history stores the return value of `assessPronunciation()` — which has the character-level `overallScore`

## STOP conditions

- `PronunciationAssessment` type is used outside of `whisper-service.ts` in a way that relies on `overallScore` being word-level (checked — it's only consumed in the pronunciation UI which just displays the number)
- The `assessPhonemes` function has known bugs for the target languages (check its test file)

## Commands you will need

| Purpose   | Command                                  | Expected on success |
| --------- | ---------------------------------------- | ------------------- |
| Typecheck | `pnpm run typecheck`                     | exit 0, no errors   |
| Tests     | `pnpm run test -- audio-engine\|phoneme` | all pass            |
| Lint      | `pnpm exec biome check --write`          | exit 0              |

## Scope

**In scope**:

- `src/lib/audio-engine/whisper-service.ts` — change `overallScore` computation to use `phonemeAccuracy` as the primary score
- `wordScores` — keep per-word character accuracy as a fallback metric but add `phonemeAccuracy` per word if available
- `PronunciationAssessment` type — preserve backward compatibility (don't remove `wordScores`, don't rename fields)

**Out of scope**:

- Changing the `PronunciationHistory` Dexie schema
- Changing `fluencyScore` (separate metric based on word count ratio)
- Adding new UI for phoneme-level detail display (that's a future improvement)

## Steps

### Step 1: Read the current scoring logic

Read `src/lib/audio-engine/whisper-service.ts:153-184` and `src/lib/audio-engine/phoneme-service.ts:339-370` to understand the exact return types.

### Step 2: Update overallScore to use phoneme accuracy

Change `assessPronunciation()` so that `overallScore` is derived from `phonemeAccuracy` (which is already computed at line 170). If `phonemeAccuracy` is `null` or `undefined` (e.g., phoneme service couldn't align), fall back to the word-level score:

```ts
const { phonemeAccuracy, phonemeDetails } = assessPhonemes(studentText, expectedText);

const overallScore =
  phonemeAccuracy !== undefined && phonemeAccuracy !== null
    ? Math.round(phonemeAccuracy * 100)
    : Math.round((correctCount / wordScores.length) * 100);
```

If `phonemeAccuracy` from `assessPhonemes` is already 0-100 rather than 0-1, adjust accordingly (read the implementation — it returns a ratio according to the type test).

### Step 3: Update tests

Read `src/lib/audio-engine/__tests__/`. Find tests that assert `overallScore` values. Update expected values to reflect phoneme-based scoring. Add a test case where character-level score differs from phoneme score (e.g., "thing" vs "think") and verify the phoneme score is higher.

### Step 4: Run typecheck + tests

Run `pnpm run typecheck` — 0 errors. Run `pnpm run test -- audio-engine phoneme` — all pass with updated expectations. Run `pnpm exec biome check --write` — 0 errors on changed files.

## Verification

1. `assessPronunciation("thing", "think")` returns `overallScore` closer to 0.9 (one phoneme off) rather than 0.6 (6 of 10 characters)
2. `assessPronunciation("hello", "hello")` returns `overallScore` of 100 (unchanged for exact matches)
3. All existing pronunciation UI and history still works (same field names, same display)
