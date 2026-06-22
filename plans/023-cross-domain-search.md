# Plan 023: Cross-domain search — add stories + lessons + vocabulary

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: LOW
- **Depends on**: none

## Why this matters

Search currently covers questions, wrong answers, flashcards, notes, quiz attempts, exam sessions, progress, study guides, and dictionary. Missing: stories, lessons, and vocabulary. Users cannot find story content or lessons via the dashboard search.

## Scope

**In scope**:

- `src/lib/services/search-service.ts` — add 3 new search functions + wire into searchAll
- `src/lib/services/types.ts` (if exists) — add story/lesson/vocabulary types
- `src/components/dashboard/search/search-results.tsx` — add typeConfig entries
- Fix dictionary type bug (currently typed as "note" instead of "dictionary")

**Out of scope**: Full-text indexing engine, curriculum search

## Steps

1. Expand `SearchDb` type to include `storyCache`, `lessonCache`, `vocabularyList`
2. Expand `SearchResultItem` union with `"story"`, `"lesson"`, `"vocabulary"`
3. Add `searchDexieStories()` — search storyCache by title, content, author, topics
4. Add `searchDexieLessons()` — search lessonCache by title, section content, keyPoints, vocabulary
5. Add `searchDexieVocabulary()` — search vocabularyList by word, definition, sourceLesson
6. Wire into `searchAll()` Promise.all array
7. Add `searchByType()` cases
8. Fix dictionary type bug: change `type: "note"` → `type: "dictionary"` in searchDexieDictionary()
9. Add typeConfig entries in search-results.tsx with icons and colors
10. Verify: `npx tsc --noEmit`, `npx biome check`, `bun run test`

## Done criteria

- Searching "folk" finds the English folklore story
- Searching a lesson title finds the lesson
- Searching vocabulary words finds saved words
- Dictionary results show the dictionary icon, not the note icon
- All verification passes
