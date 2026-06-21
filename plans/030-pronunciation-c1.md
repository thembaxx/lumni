# Plan 030: Pronunciation C1 — phoneme assessment + lesson integration

## Status
- **Priority**: P3
- **Effort**: M
- **Risk**: MED
- **Depends on**: none

## Why this matters
Pronunciation pipeline exists (Whisper → Levenshtein → UI) but only does word-level accuracy. Roadmap calls for phoneme-level assessment using IPA alignment. Adding this and integrating pronunciation practice into lesson cards closes the C1 loop.

## Scope
**In scope**:
- `src/lib/audio-engine/phoneme-service.ts` — new IPA phoneme alignment service
- `src/lib/audio-engine/whisper-service.ts` — add phoneme-level scoring
- `src/components/lesson/lesson-card.tsx` — add pronunciation practice button
- `src/lib/pronunciation/` — consolidate pronunciation logic

**Out of scope**: Server-side speech API, structured pronunciation curriculum

## Steps

### Step 1: Create phoneme service
New file `src/lib/audio-engine/phoneme-service.ts`:
- Function: `alignPhonemes(studentText: string, expectedText: string): PhonemeAlignment[]`
- Returns array of phoneme alignments with: { expected, actual, correct: boolean, position }
- Uses IPA phonological mapping rules for English phonemes
- Maps words to ARPABET/phoneme sequences using a pronunciation dictionary (cmudict-style)

### Step 2: Add phoneme scoring to Whisper service
In `whisper-service.ts`, extend `assessPronunciation()`:
- After word-level Levenshtein, call phoneme alignment
- Return enriched result with: { wordAccuracy, phonemeAccuracy, phonemeDetails, fluencyScore }

### Step 3: Add pronunciation practice to lesson cards
In `lesson-card.tsx`:
- For vocabulary words in a lesson, add "Practice Pronunciation" button
- Links to `/pronunciation?word=...` with the word pre-loaded
- Uses the existing pronunciation page's record → transcribe → score flow

### Step 4: Verify
```bash
npx tsc --noEmit
npx biome check
bun run test
```

## Done criteria
- Phoneme-level scoring added alongside word-level scoring
- Pronunciation practice button appears on lesson vocabulary words
- Lesson card links to pronunciation page with word pre-loaded
- All verification passes
