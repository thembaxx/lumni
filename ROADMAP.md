# Roadmap

This file is manually maintained alongside the master roadmap at [`docs/roadmap.md`](./docs/roadmap.md).
Shipped items are tracked there with ✅; update that file, then mirror the state here.

## Recently Shipped

### Pronunciation (C1) — Shipped July 2026

- [x] **Phoneme-level assessment**: Phoneme alignment via `phoneme-service.ts`
- [x] **Pronunciation history**: Track scores over time in Dexie, show improvement charts
- [x] **Lesson integration**: Vocab words link to pronunciation practice in lesson view

### Dictionary (C2) — Shipped July 2026

- [x] **Afrikaans / isiZulu / isiXhosa support**: Wire Wiktionary API for SA language word lookups
- [x] **Word of the Day**: Daily featured word on dashboard (`word-of-day.tsx`)
- [x] **Vocabulary builder**: Save words to personal list, spaced-repetition via vocabulary-bridge (`VocabularyService`, `VocabularyListCard`)
- [x] **Lesson integration**: `WordLookupPopover` + `SaveVocabularyButton` in lesson view

### Stories (D1) — Shipped July 2026

- [x] **Story content**: Project Gutenberg SA public domain works (Honey, Schreiner, Plaatje, Bleek, Metelerkamp)
- [x] **Story content**: AI-generated stories across 11 SA languages
- [x] **Story exercises**: Fill-in-the-blank, vocabulary matching, comprehension questions (MCQ, short-answer, true-false)
- [x] **Progress tracking**: Story progress via Dexie `storyProgress` table + `StoryProgressBar`

### Infrastructure

- [x] **Cross-device sync layer** — Phase A (Session 50)
- [x] **Unified STT engine** — Deepgram + Browser-native + Whisper fallback (Session 50)
- [x] **Shared subject color/abbreviation maps** (Session 50)
- [x] **Custom domain + production deployment** — design spike done (Plan 096)
- [x] **Live leaderboard**
- [x] **Effect TS strategy** — Hold recommendation adopted (Plans 095/097)

## Next Up

- [ ] Story content: Add CC-BY stories from African Storybook across all 11 SA languages
- [ ] Audio narration: TTS integration for read-aloud stories
- [ ] OCR-based PDF scraping for DBE timetables
