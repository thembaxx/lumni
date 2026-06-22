# ADR-0011: DataAccess Seam

**Status:** Implemented — Complete (Session 33) · **Date:** 2026-06-04 · **Author:** AI Session 23, refined in Session 33

## Context

~163 direct `offlineDB.*` calls across 40+ files. 8 partial repository files, only 1 with formal interface. Overlapping Dexie + Appwrite + localStorage stores. No DI for persistence — tests use fragile `Bun.mock.module`.

## Decision

Introduce a `DataAccess` seam — a narrow interface between business logic and persistence — with two implementations:

- `DexieDataAccess` (production, wraps `LumniOfflineDB`)
- `InMemoryDataAccess` (tests, uses `Map`-backed stores)

## Interface Design

### Core: `DataAccessTable<T, TId>`

Generic CRUD + query operations, modeled on the patterns actually used by consumers.

```typescript
export interface DataAccessTable<T, TId extends string | number = number> {
  get(id: TId): Promise<T | undefined>;
  add(item: Omit<T, "id">): Promise<TId>;
  put(item: T): Promise<TId>;
  update(id: TId, changes: Partial<T>): Promise<TId>;
  delete(id: TId): Promise<void>;

  bulkAdd(items: Omit<T, "id">[]): Promise<TId[]>;
  bulkPut(items: T[]): Promise<TId[]>;
  bulkDelete(ids: TId[]): Promise<void>;

  toArray(): Promise<T[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
  limit(n: number): Collection<T>;

  where(index: string): WhereClause<T>;
  orderBy(index: string): Collection<T>;
}

export interface WhereClause<T> {
  equals(val: unknown): Collection<T>;
  belowOrEqual(val: unknown): Collection<T>;
  below(val: unknown): Collection<T>;
  startsWith(val: string): Collection<T>;
  anyOf(vals: unknown[]): Collection<T>;
}

export interface Collection<T> {
  first(): Promise<T | undefined>;
  toArray(): Promise<T[]>;
  count(): Promise<number>;
  delete(): Promise<void>;
  modify(changes: Partial<T> | ((record: T) => void)): Promise<number>;
  reverse(): Collection<T>;
  limit(n: number): Collection<T>;
  filter(pred: (item: T) => boolean): Collection<T>;
  sortBy(index: string): Promise<T[]>;
}
```

### Domain sub-interfaces (Session 33)

The `DataAccess` was split into 10 domain sub-interfaces. Each is independently importable and has a single architectural concern:

| Interface                 | Tables                                                                                                                              | Typical consumers                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `FlashcardDataAccess`     | `flashcards`, `reviewHistory`                                                                                                       | flashcard-engine, study-set-editor                    |
| `CompetencyDataAccess`    | `competencies`, `progress`, `quizAttempts`                                                                                          | analytics-engine, competency-service                  |
| `QuizDataAccess`          | `questions`, `quizPacks`, `packQuestions`, `quizSessions`                                                                           | quiz-session repository, domain handlers              |
| `ContentDataAccess`       | `notes`, `bookmarks`, `sharedQuestions`, `visuals`, `cachedPdfs`, `extractionCache`                                                 | share-service, snap-fab, note-storage                 |
| `StudyDataAccess`         | `studyPlans`, `studyGuides`, `examDates`                                                                                            | study-guide service, study-planner                    |
| `SyncDataAccess`          | `wrongAnswers`, `retentionRecurrence`, `examSessions`, `chatMessages`, `questionRatings`, `jobs`, `conflicts`, `flashcardSyncState` | sync-handler, retention-service, wrong-answer-journal |
| `ObservabilityDataAccess` | `analyticsEvents`, `gamification`                                                                                                   | events tracker, use-gamification                      |
| `SocialDataAccess`        | `userConsents`                                                                                                                      | user-consent service                                  |
| `CacheDataAccess`         | `tinyfishCache`, `tinyfishUsage`, `knowledgeGraph`                                                                                  | tinyfish cache, knowledge-graph service               |
| `LegacyDataAccess`        | `subjects`, `pastPaperQuestions`                                                                                                    | use-subjects, past-paper extractor                    |

The composite `DataAccess` extends all 10 sub-interfaces for backward compat. Cross-domain consumers (sync-handler, search-service, etc.) keep the full composite.

11 dead table accessors were removed (no consumers found anywhere in the codebase): `groupPosts`, `groupComments`, `groupReactions`, `groupChallenges`, `groupChallengeEntries`, `groupBadges`, `teacherObservations`, `assignmentMessages`, `onboardingState`, `srDailyBudget`.

**Total: 33 tables** (down from 39).

### Dependency Injection

Consumers receive a `DataAccess` (or narrower sub-interface) in their constructor / `_deps` object:

```typescript
// Narrowed to single domain
class AnalyticsEngine {
  constructor(deps?: { db?: CompetencyDataAccess }) {
    this.db = deps?.db ?? dexieDataAccess;
  }
}

// Cross-domain kept as composite
class SyncHandler {
  private _deps: { db: DataAccess } = { db: dexieDataAccess };
}
```

## Implementation: `DexieDataAccess`

Thin adapter — each method delegates 1:1 to the corresponding `offlineDB` table. Generated via `tableAdapter()` factory for all 33 active tables.

## Implementation: `InMemoryDataAccess`

Map-backed, for unit tests. No external dependencies. Implements the full 33-table `DataAccess` interface.

## All phases complete

| Phase | What                      | Migrated to DataAccess                                                                                                                                          |
| ----- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | Foundation                | `FlashcardEngine`, `CompetencyService`                                                                                                                          |
| 2     | Top consumers             | `AnalyticsEngine`, `RetentionService`, `QuizPackService`, `WrongAnswerJournal`                                                                                  |
| 3     | Expand + batch migrate    | 20+ files: sync-handler, knowledge-graph, chat-context, notification-service, search-service, share-service, exam-dates, export, chunked-search, 4 repositories |
| 4     | localStorage → Dexie      | `studyPlans`, `onboardingState`, `srDailyBudget`, `flashcardSyncState`                                                                                          |
| —     | Domain split (Session 33) | 10 sub-interfaces, 11 dead accessors removed, 4 consumers narrowed to sub-interfaces, 19 narrowed in `_deps` pattern                                            |

## Excluded from scope

- **Appwrite** (`src/lib/db/client.ts`) — stays as-is. Seam is Dexie-only.
- **localStorage** — settings/flags stay as-is.
- **SQLite exams.db** — separate store, different concerns.
