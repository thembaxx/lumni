# Roadmap

This file is auto-generated from the master roadmap at [`docs/roadmap.md`](./docs/roadmap.md).
Shipped items are tracked there with ✅; update that file, not this one.

## Short-term (next 1–2 sprints)

### Pronunciation (C1)

- [ ] **Phoneme-level assessment**: Replace Levenshtein distance with IPA phoneme alignment (STT engine tracked in `docs/decisions/`)
- [ ] **Pronunciation history**: Track scores over time in Dexie, show improvement charts
- [ ] **Lesson integration**: Surface pronunciation practice in lesson cards for vocab words

### Dictionary (C2)

- [ ] **Afrikaans / isiZulu / isiXhosa support**: Wire Wiktionary API (`en.wiktionary.org/w/api.php`) for SA language word lookups
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

## Medium-term

- [ ] **Cross-device sync layer**: See design exploration in `docs/decisions/`
- [ ] **Unified STT engine**: Provider abstraction over Deepgram + Whisper + Browser
- [ ] **Custom domain + production deployment**
- [ ] **OCR-based PDF scraping for DBE timetables**
