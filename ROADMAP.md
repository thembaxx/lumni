# Roadmap

This file is manually maintained alongside the master roadmap at [`docs/roadmap.md`](./docs/roadmap.md).
Shipped items are tracked there with ✅; update that file, then mirror the state here.

## Short-term (next 1–2 sprints)

### Pronunciation (C1)

- [ ] **Phoneme-level assessment**: Replace Levenshtein distance with IPA phoneme alignment (STT engine tracked in `docs/decisions/`)
- [x] **Pronunciation history**: Track scores over time in Dexie, show improvement charts
- [ ] **Lesson integration**: Surface pronunciation practice in lesson cards for vocab words

### Dictionary (C2)

- [x] **Afrikaans / isiZulu / isiXhosa support**: Wire Wiktionary API (`en.wiktionary.org/w/api.php`) for SA language word lookups
- [ ] **Word of the Day**: Daily featured word on dashboard
- [ ] **Vocabulary builder**: Save words to personal list, spaced-repetition review
- [ ] **Lesson integration**: Link vocab words in lessons to dictionary lookup

### Stories (D1)

- [ ] **Story content**: Add CC-BY stories from African Storybook across all 11 SA languages
- [ ] **Story content**: Add Project Gutenberg SA public domain works (Honey, Fitzpatrick, Schreiner, Bosman)
- [ ] **Story content**: AI-generate stories for curriculum topics not covered by existing sources
- [ ] **Audio narration**: TTS integration for read-aloud stories
- [ ] **Story exercises**: Fill-in-the-blank, vocabulary matching, summary writing
- [ ] **Progress tracking**: Track stories read, comprehension scores, reading speed

## Recently Shipped

- [x] **Cross-device sync layer** — Phase A (Session 50)
- [x] **Unified STT engine** — Deepgram + Browser-native + Whisper fallback (Session 50)

## Medium-term

- [x] **Custom domain + production deployment** (planning complete — see `docs/deployment.md`)
- [ ] **OCR-based PDF scraping for DBE timetables**
