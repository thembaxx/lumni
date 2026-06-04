# ADR-0011: DataAccess Seam

**Status:** Implemented — Phase 1 · **Date:** 2026-06-04 · **Author:** AI Session 23

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
  // CRUD
  get(id: TId): Promise<T | undefined>;
  add(item: Omit<T, "id">): Promise<TId>;
  put(item: T): Promise<TId>;
  update(id: TId, changes: Partial<T>): Promise<TId>;
  delete(id: TId): Promise<void>;

  // Bulk
  bulkAdd(items: Omit<T, "id">[]): Promise<TId[]>;
  bulkDelete(ids: TId[]): Promise<void>;

  // Full table
  toArray(): Promise<T[]>;
  count(): Promise<number>;
  clear(): Promise<void>;

  // Index queries
  where(index: string): WhereClause<T>;
  orderBy(index: string): SortedQuery<T>;
}

export interface WhereClause<T> {
  equals(val: unknown): Collection<T>;
  belowOrEqual(val: unknown): Collection<T>;
  below(val: unknown): Collection<T>;
  startsWith(val: string): Collection<T>;
  anyOf(vals: unknown[]): Collection<T>;
  /** Compound match: where({ key: val, key2: val2 }).first() */
  compound(query: Record<string, unknown>): Collection<T>;
}

export interface Collection<T> {
  first(): Promise<T | undefined>;
  toArray(): Promise<T[]>;
  count(): Promise<number>;
  delete(): Promise<void>;
  reverse(): SortedQuery<T>;
  limit(n: number): Collection<T>;
  filter(pred: (item: T) => boolean): Collection<T>;
  sortBy(index: string): Promise<T[]>;
}

export interface SortedQuery<T> {
  toArray(): Promise<T[]>;
  limit(n: number): SortedQuery<T>;
  first(): Promise<T | undefined>;
}
```

### Accessor: `DataAccess`

One typed accessor per Dexie table. 39 tables, each typed to its row interface.

```typescript
export interface DataAccess {
  flashcards: DataAccessTable<FlashcardSM2, string>;
  reviewHistory: DataAccessTable<FlashcardReview, number>;
  analyticsEvents: DataAccessTable<AnalyticsEvent, number>;
  retentionRecurrence: DataAccessTable<RetentionRecurrence, number>;
  wrongAnswers: DataAccessTable<WrongAnswerEntry, number>;
  quizPacks: DataAccessTable<QuizPack, string>;
  packQuestions: DataAccessTable<QuizPackQuestion, number>;
  competencies: DataAccessTable<CompetencyRecord, number>;
  progress: DataAccessTable<CachedProgress, number>;
  quizAttempts: DataAccessTable<QuizAttempt, number>;
  quizSessions: DataAccessTable<QuizSessionState, number>;
  visuals: DataAccessTable<CachedVisual, number>;
  questions: DataAccessTable<CachedQuestion, number>;
  subjects: DataAccessTable<CachedSubject, number>;
  bookmarks: DataAccessTable<BookmarkRecord, number>;
  examSessions: DataAccessTable<ExamSessionSnapshot, number>;
  cachedPdfs: DataAccessTable<CachedPdf, number>;
  examDates: DataAccessTable<CachedExamDates, number>;
  // ... remaining 21 tables follow same pattern
}
```

### Dependency Injection

Consumers receive a `DataAccess` in their constructor / deps object:

```typescript
// Before
import { offlineDB } from "@/lib/db/schema";

// After
class CompetencyService {
  constructor(private db: DataAccess) {}
}
```

## Implementation: `DexieDataAccess`

Thin adapter — each method delegates 1:1 to the corresponding `offlineDB` table.

```typescript
export class DexieDataAccess implements DataAccess {
  // Auto-generated via factory for all 39 tables
  flashcards = tableAdapter(offlineDB.flashcards);
  competencies = tableAdapter(offlineDB.competencies);
  // ...

  private tableAdapter<T, TId>(table: DexieTable<T, TId>): DataAccessTable<T, TId> {
    return {
      get: (id) => table.get(id),
      add: (item) => table.add(item as T),
      // ...
    };
  }
}
```

## Implementation: `InMemoryDataAccess`

Map-backed, for unit tests. No external dependencies.

```typescript
export class InMemoryDataAccess implements DataAccess {
  // Pre-populated with empty Map stores
  flashcards = inMemoryTable<FlashcardSM2, string>();
  competencies = inMemoryTable<CompetencyRecord, number>();
  // ...
}
```

## Migration Order

| Phase | Consumers | Ops | Files |
|-------|-----------|-----|-------|
| 1 | `FlashcardEngine`, `CompetencyService` | ~35 | 2 engines, ~10 tests |
| 2 | `RetentionLoop`, `AnalyticsEngine` | ~30 | 2 services, ~5 tests |
| 3 | `QuizPackService`, `WrongAnswerJournal` | ~24 | 2 consumers |
| 4 | `Observability`, `StudyPlanner`, `SearchService` | ~30 | 5 consumers |
| 5 | Remaining ~20 files | ~44 | ~20 files |

## Excluded from scope

- **Appwrite** (`src/lib/db/client.ts`) — stays as-is. Seam is Dexie-only.
- **localStorage** — settings/flags stay as-is.
- **SQLite exams.db** — separate store, different concerns.
- **`offlineDB.table("name")` string pattern** — migrated to typed accessor during its phase.
