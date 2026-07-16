## Description

Implement true offline-first quiz experience: pre-generate AI question packs per subject/topic, store in Dexie (IndexedDB), enable full quiz offline, sync results when online.

## Acceptance Criteria

- [ ] `POST /api/quiz-packs/generate` -- bulk generate 50-100 questions per subject/topic using QuestionEngine
- [ ] Dexie tables: `quizPacks` (pack metadata, TTL 30d), `packQuestions` (questions + visual assets)
- [ ] Service Worker: cache quiz pack assets, serve offline, background sync on reconnect
- [ ] `useQuizPacks()` hook: list available packs, download progress, storage quota indicator
- [ ] `<OfflinePackManager>` dashboard component: subject selector, pack list with status badges (Downloading/Ready/Stale/Expired)
- [ ] Quiz session reads from local pack when offline; `QuizResultProcessor` queues results to sync outbox
- [ ] Storage quota management: LRU eviction, user-visible quota bar, "Clear old packs" action
- [ ] Background sync: `sync-handler.ts` job type `quiz-pack-sync` pushes results, pulls fresh packs

## Technical Details

- Extends `src/lib/quiz-packs/` (S28) + `src/lib/sync/` (S50)
- Reuses `QuestionEngine.generateInternal()` with `count: 50-100`
- VisualEngine pre-generates diagrams for all questions in pack
- `CachedAIGenerator<T>` pattern for pack generation idempotency
- Dexie v41: add `quizPacks`, `packQuestions` tables (migration)

## Dependencies

- Sync layer Phase A (S50) -- `src/lib/sync/outbox.ts`, `sync-handler.ts`
- QuizPackService (S28) -- `src/lib/quiz-packs/service.ts`
- Service Worker -- `public/sw.js` (S29)

## Effort

3-4 sprints (2-3 engineers)
