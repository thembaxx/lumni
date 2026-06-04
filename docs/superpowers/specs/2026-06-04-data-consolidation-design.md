# Data Consolidation — Single Source of Truth

**Date:** 2026-06-04
**Status:** Approved design

## Problem

The Lumni client has 3 storage backends (Dexie/IndexedDB, Appwrite, localStorage) plus SQLite on the server, with significant data fragmentation:

- **Same data in 2-3 stores**: bookmarks, gamification, shared questions, visuals, user consents, chat history, exam sessions
- **30+ localStorage keys**: some orphaned after migration, some dual-written to Dexie, some the sole copy
- **DataAccess seam incomplete**: only 2 of 37+ consumers use the typed interface; the rest call `offlineDB.*` directly
- **Appwrite read from client code**: breaks offline-first; client imports Appwrite SDK directly
- **SQLite exams.db triplicates** exam paper metadata already in Appwrite

## Goal

Dexie becomes the single source of truth for all client-side data. Appwrite becomes a write-only sync target (never read from client code). localStorage holds preferences only. All data access goes through the typed `DataAccess` interface.

## Approach: Domain-by-Domain

Four phases executed in dependency order. Each phase is independently shippable.

---

## Phase 1: DataAccess Seam Completion

**Status:** Design approved

Complete the Phase 1 DataAccess seam from ADR-0011. All 37+ consumers migrate from direct `offlineDB.*` calls to the typed `DataAccess` interface. Fix the `InMemoryDataAccess` `any` types for testability.

### Steps

| Step | Files | What Changes |
|------|-------|--------------|
| 1a. Fix InMemoryDataAccess types | `src/lib/db/in-memory-data-access.ts` | Replace `any` with proper type bridging for all 38 tables |
| 1b. Migrate quiz domain | `use-quiz-session.ts`, `use-quiz.ts`, `quiz-engine.tsx`, quiz-session reducer, quiz-results | Replace `offlineDB.quizSessions`, `offlineDB.questions` |
| 1c. Migrate gamification | `use-gamification.ts`, `gamification-engine.ts` | Replace `offlineDB.gamification` |
| 1d. Migrate bookmarks + notes | `bookmark-service.ts`, `use-note-storage.ts`, `search.ts`, bookmark/note hooks | Replace `offlineDB.bookmarks`, `offlineDB.notes` |
| 1e. Migrate wrong-answers + ratings | `wrong-answer-journal.tsx`, `question-rating-service.ts` | Replace `offlineDB.wrongAnswers`, `offlineDB.questionRatings` |
| 1f. Migrate chat + visual cache | `use-chat.ts`, `visual-engine.ts` | Replace `offlineDB.chatMessages`, `offlineDB.visuals` |
| 1g. Migrate TinyFish cache | `src/lib/tinyfish/cache.ts` | Inject DataAccess instead of importing `dexieDataAccess` directly |
| 1h. Migrate remaining domains | group posts/comments/reactions, challenges, badges, analytics, retention, shared questions, teacher features | Replace ~10 files' direct `offlineDB` calls |

### DI Pattern

- Module-level singleton `dataAccess: DataAccess` instance (same pattern as existing `offlineDB`)
- For classes: constructor injection (`FlashcardEngine`, `CompetencyService` already done)
- For hooks: import the singleton at module level

### Testing Win

Every migrated consumer becomes testable with `InMemoryDataAccess.seed()`. No Dexie mock required.

---

## Phase 2: localStorage → Dexie Migration

**Status:** Design approved

Move all non-preference localStorage data into Dexie behind the DataAccess interface.

### Domains to Migrate

| Domain | localStorage Keys | Target Dexie Table | Migration Strategy |
|--------|------------------|-------------------|--------------------|
| Gamification | `lumni_gamification`, `lumni_display_name`, `lumni_last_streak_alert_notification`, `lumni_last_checked_achievement_count` | `gamification` (already exists) | Stop dual-write. Flip read path from localStorage-first to Dexie-first. Legacy key as fallback during migration window, then drop. |
| Bookmarks | `lumni_bookmarks` (zustand persist) | `bookmarks` (already exists) | Remove `persist(localStorage)` from zustand store. DataAccess bookmarks table becomes source. Cross-tab sync via Dexie `on('changes')`. |
| Chat | `lumni_chat_history` | `chatMessages` (already exists) | Stop writing both. Dexie-only. Legacy read + drop. |
| Study plan | `lumni_study_plan`, `lumni_plan_target_aps`, `lumni_plan_daily_minutes` | `studyPlans` (new, v31) | New Dexie table. Migration read from localStorage on first load. |
| Engine analytics | `lumni_engine_quality`, `lumni_engine_analytics`, `lumni_ai_latency`, `lumni_usage_events` | `analyticsEvents` (exists, `eventType` column) | Consolidate all 4 arrays into existing table. |
| Exam session | `exam-session-storage` (zustand persist) | `examSessions` (already exists) | Remove `persist`. Session state loaded from Dexie on mount, auto-saved on changes. |
| Onboarding | `lumni_onboarding`, `lumni_has_visited`, `lumni_first_visits_remaining` | `onboardingState` (new, v31) — small table, single row per user | Migrate on first read. |
| SR daily budget | `lumni_sr_daily_budget` | `srDailyBudget` (new, v31) | Small cache-like data, but it's state not preference. Move to Dexie. |
| Flashcard sync | `lumni_flashcard_last_sync` | `flashcardSyncState` (new, v31) | Single-value state. Move to Dexie. |

### localStorage Keys That Stay (Preferences)

- `theme` (light/dark/system)
- `study-preferences` (difficulty, count, timer defaults)
- `lumni_notification_settings` (push notification prefs)
- `lumni_premium_status` (cached premium state)
- `beta-features` (opt-in flags)
- `lumni_sr_settings` (SM-2 config: learning steps, daily limits, leech threshold)
- `pwa-install-dismissed` (UI flag)

These are true preferences — small, no consistency requirement, no cross-session conflict risk.

### Dexie Schema: v31

```
studyPlans: &id, subject, generatedAt, sessions[]
onboardingState: &userId, hasVisited, firstVisitsRemaining, onboardingData
srDailyBudget: &userId, date, newCardsUsed, reviewsUsed
flashcardSyncState: &userId, lastSyncTimestamp
```

No schema changes to existing tables (the data already fits).

---

## Phase 3: Appwrite Sync Consolidation

**Status:** Design approved

Convert Appwrite from a client-readable store to a write-only sync target. All client data access goes through DataAccess → Dexie. Appwrite is written to in background via SyncManager.

### SyncManager (`src/lib/db/sync-manager.ts`)

- Single class coordinating all Dexie→Appwrite sync
- Watches DataAccess tables for changes (callback pattern or explicit `sync()` from write paths)
- Reuses existing `jobs` Dexie table as sync queue
- Processes via existing `job-processor.ts`
- Conflict resolution: server-wins + local retry on conflict
- Offline-resilient: drops retries when offline, resumes on reconnect

### Client-Side Appwrite Reads to Eliminate

| Hook | Replacement |
|------|-------------|
| `useSubjects()` | Read from Dexie `subjects` table (synced periodically) |
| `useExamPaper()` | Read from Dexie `cachedPdfs` + `examSessions` |
| `useExams()` | Read from Dexie `examDates` |
| `useStudyGroups()` | Read from Dexie `groupPosts`/`groupComments`/`groupReactions` |

### Dual-Writes to Collapse

| Domain | Current | New |
|--------|---------|-----|
| Bookmarks | Dexie + Appwrite inline | Dexie only → SyncManager |
| Shared questions | Dexie + Appwrite inline | Dexie only → SyncManager |
| User consents | Dexie + Appwrite job enqueue | Dexie only → SyncManager |
| Visuals | Dexie + Appwrite inline | Dexie only → SyncManager |

### Server-Side Appwrite Reads That Stay

- `GET /api/sync` — server reads Appwrite to seed Dexie
- `POST /api/engine/generate` — server-side AI, no client dependency
- Admin dashboard — admin-only, reads Appwrite directly

### Net Change

Client code never imports `appwrite` SDK. All data access: `DataAccess` → Dexie → (background) → Appwrite.

---

## Phase 4: SQLite exams.db Unification

**Status:** Design approved

Eliminate the SQLite `exams.db` as a third server-side store. Migrate exam paper metadata into Appwrite as the single server-side record.

### Changes

- Remove `src/lib/db/exams/index.ts` (SQLite wrapper)
- Server upload routes: switch from `exams.db` queries to Appwrite SDK queries
- Remove `sql.js` from `package.json` dependencies
- Dexie `cachedPdfs` stays as blob cache (no change)
- Dexie `examSessions` stays as session snapshot store (no change)

---

## Verification

Each phase verified independently:

- `npx tsc --noEmit` — zero errors
- `npx biome check` — zero warnings on changed files
- `bun test` — no regressions (1226 baseline)
- Specific per-phase tests:
  - Phase 1: All migrated consumers have `InMemoryDataAccess` unit tests
  - Phase 2: localStorage migration tests for each domain (data persists after clear, legacy keys read then dropped)
  - Phase 3: SyncManager integration test (Dexie write → job enqueue → Appwrite write)
  - Phase 4: Server upload route uses Appwrite instead of SQLite

## Timeline

| Phase | Estimated File Changes | Risk |
|-------|----------------------|------|
| Phase 1: DataAccess seam | ~35 files | Medium — mechanical but wide surface |
| Phase 2: localStorage → Dexie | ~20 files | Medium — legacy migration paths |
| Phase 3: Sync consolidation | ~15 files | Low — new code, no consumer API changes |
| Phase 4: SQLite removal | ~5 files | Low — server-only, well-scoped |

---

## Appendix: Current Data Storage Map

For reference, the full landscape at design time (2026-06-04):

**Dexie (39 tables, v30):** flashcards, reviewHistory, extractionCache, chatMessages, questions, progress, quizAttempts, subjects, quizSessions, conflicts, jobs, competencies, visuals, wrongAnswers, questionRatings, examSessions, cachedPdfs, examDates, bookmarks, notes, groupPosts, groupComments, groupReactions, gamification, quizPacks, packQuestions, pastPaperQuestions, groupChallenges, groupChallengeEntries, groupBadges, userConsents, tinyfishCache, tinyfishUsage, analyticsEvents, retentionRecurrence, sharedQuestions, knowledgeGraph, teacherObservations, assignmentMessages

**Appwrite (~41 collections):** overlaps heavily with Dexie. 18 have schema definitions, ~23 are name-only.

**localStorage (30+ keys):** fragmented across gamification, bookmarks, chat, study plan, exam sessions, onboarding, analytics, SR budget, flashcard sync, plus preferences.

**SQLite (`exams.db`):** exam_papers table (subject, year, paper_number, type, file_url, file_key).

**In-memory:** React Query (60s stale, 24h GC), TinyFish in-flight dedup Map, React contexts (7), Zustand stores (7, 2 persisted).
