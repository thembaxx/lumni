# Roadmap

## Wave 2 — Feature UI & Content

### Pronunciation (C1)

- [ ] **Install whisper model on first use**: Show download progress bar for ~80MB model (Cache API)
- [ ] **Whisper accuracy tuning**: Fine-tune on NCHLT Speech Corpus for SA language accuracy
- [ ] **Phoneme-level assessment**: Replace Levenshtein distance with IPA phoneme alignment
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

### Search

- [ ] **Cross-domain search**: Search stories + dictionary + lessons + past questions from unified search bar

### Teacher Tools

- [ ] **Assignment sharing**: Teacher shares stories + comprehension questions to class
- [ ] **Student progress**: Teacher dashboard shows reading progress per student

## Wave 3 — i18n & Offline

- [ ] **Full i18n**: Translate all UI text to Afrikaans and isiZulu (beyond nav/consent)
- [ ] **Offline dictionary cache**: Pre-populate common words on app install
- [ ] **Offline stories bundle**: Cache 5 stories per language on first sync
- [ ] **PWA install prompt**: Improved install experience + offline page content
