import type { Collection as DexieCollection, IndexableType, Table, UpdateSpec } from "dexie";
import type { Collection, DataAccess, DataAccessTable, WhereClause } from "@/lib/db/data-access";
import { offlineDB } from "@/lib/db/schema";

// ──────────────────────────────────────────────
// Dexie adapter wrappers
// ──────────────────────────────────────────────

class DexieCollectionAdapter<T> implements Collection<T> {
  constructor(private readonly source: DexieCollection<T, unknown>) {}

  async first(): Promise<T | undefined> {
    return this.source.first();
  }

  async toArray(): Promise<T[]> {
    return this.source.toArray();
  }

  async count(): Promise<number> {
    return this.source.count();
  }

  async delete(): Promise<void> {
    await this.source.delete();
  }

  async modify(changes: Partial<T> | ((record: T) => void)): Promise<number> {
    return this.source.modify(changes as UpdateSpec<T>);
  }

  reverse(): Collection<T> {
    return new DexieCollectionAdapter(this.source.reverse());
  }

  toReversed(): Collection<T> {
    return this.reverse();
  }

  limit(n: number): Collection<T> {
    return new DexieCollectionAdapter(this.source.limit(n));
  }

  offset(n: number): Collection<T> {
    return new DexieCollectionAdapter(this.source.offset(n));
  }

  filter(pred: (item: T) => boolean): Collection<T> {
    return new DexieCollectionAdapter(this.source.and(pred));
  }

  async sortBy(index: string): Promise<T[]> {
    return this.source.sortBy(index);
  }
}

class DexieWhereClauseAdapter<T> implements WhereClause<T> {
  constructor(
    private readonly table: Table<T, unknown>,
    private readonly index: string,
  ) {}

  equals(val: unknown): Collection<T> {
    return new DexieCollectionAdapter(this.table.where(this.index).equals(val as IndexableType));
  }

  aboveOrEqual(val: unknown): Collection<T> {
    return new DexieCollectionAdapter(
      this.table.where(this.index).aboveOrEqual(val as IndexableType),
    );
  }

  above(val: unknown): Collection<T> {
    return new DexieCollectionAdapter(this.table.where(this.index).above(val as IndexableType));
  }

  belowOrEqual(val: unknown): Collection<T> {
    return new DexieCollectionAdapter(
      this.table.where(this.index).belowOrEqual(val as IndexableType),
    );
  }

  below(val: unknown): Collection<T> {
    return new DexieCollectionAdapter(this.table.where(this.index).below(val as IndexableType));
  }

  startsWith(val: string): Collection<T> {
    return new DexieCollectionAdapter(
      this.table.where(this.index).startsWith(val as IndexableType & string),
    );
  }

  anyOf(vals: unknown[]): Collection<T> {
    return new DexieCollectionAdapter(this.table.where(this.index).anyOf(vals as IndexableType[]));
  }
}

// ──────────────────────────────────────────────
// Factory: create DataAccessTable from Dexie table
// ──────────────────────────────────────────────

function tableAdapter<T, TId extends string | number>(
  table: Table<T, TId>,
): DataAccessTable<T, TId> {
  return {
    get: (id) => table.get(id),
    add: (item) => table.add(item as T & Record<string, unknown>),
    put: (item) => table.put(item),
    update: (id, changes) =>
      table.update(id, changes as unknown as UpdateSpec<T>) as unknown as Promise<TId>,
    delete: (id) => table.delete(id) as unknown as Promise<void>,

    bulkAdd: (items) =>
      table.bulkAdd(items as (T & Record<string, unknown>)[]) as unknown as Promise<TId[]>,
    bulkPut: (items) => table.bulkPut(items) as unknown as Promise<TId[]>,
    bulkDelete: (ids) => table.bulkDelete(ids) as unknown as Promise<void>,

    toArray: () => table.toArray(),
    count: () => table.count(),
    clear: () => table.clear(),
    limit: (n: number) =>
      new DexieCollectionAdapter(table.limit(n) as unknown as DexieCollection<T, unknown>),

    where: (index: string) => {
      return new DexieWhereClauseAdapter<T>(table as unknown as Table<T, unknown>, index);
    },

    orderBy: (index: string) =>
      new DexieCollectionAdapter(table.orderBy(index) as unknown as DexieCollection<T, unknown>),
  };
}

// ──────────────────────────────────────────────
// Dexie implementation
// ──────────────────────────────────────────────

class DexieDataAccess implements DataAccess {
  questionEmbeddings = tableAdapter(offlineDB.questionEmbeddings);
  flashcards = tableAdapter(offlineDB.flashcards);
  reviewHistory = tableAdapter(offlineDB.reviewHistory);
  analyticsEvents = tableAdapter(offlineDB.analyticsEvents);
  retentionRecurrence = tableAdapter(offlineDB.retentionRecurrence);
  wrongAnswers = tableAdapter(offlineDB.wrongAnswers);
  quizPacks = tableAdapter(offlineDB.quizPacks);
  packQuestions = tableAdapter(offlineDB.packQuestions);
  competencies = tableAdapter(offlineDB.competencies);
  progress = tableAdapter(offlineDB.progress);
  quizAttempts = tableAdapter(offlineDB.quizAttempts);
  bookmarks = tableAdapter(offlineDB.bookmarks);
  questions = tableAdapter(offlineDB.questions);
  subjects = tableAdapter(offlineDB.subjects);
  visuals = tableAdapter(offlineDB.visuals);
  chatMessages = tableAdapter(offlineDB.chatMessages);
  questionRatings = tableAdapter(offlineDB.questionRatings);
  knowledgeGraph = tableAdapter(offlineDB.knowledgeGraph);
  examSessions = tableAdapter(offlineDB.examSessions);
  sharedQuestions = tableAdapter(offlineDB.sharedQuestions);
  essayDrafts = tableAdapter(offlineDB.essayDrafts);
  examDates = tableAdapter(offlineDB.examDates);
  extractionCache = tableAdapter(offlineDB.extractionCache);
  notes = tableAdapter(offlineDB.notes);
  gamification = tableAdapter(offlineDB.gamification);
  cachedPdfs = tableAdapter(offlineDB.cachedPdfs);
  quizSessions = tableAdapter(offlineDB.quizSessions);
  tinyfishCache = tableAdapter(offlineDB.tinyfishCache);
  tinyfishUsage = tableAdapter(offlineDB.tinyfishUsage);
  pastPaperQuestions = tableAdapter(offlineDB.pastPaperQuestions);
  seenPastPaperQuestions = tableAdapter(offlineDB.seenPastPaperQuestions);
  jobs = tableAdapter(offlineDB.jobs);
  conflicts = tableAdapter(offlineDB.conflicts);
  userConsents = tableAdapter(offlineDB.userConsents);
  studyPlans = tableAdapter(offlineDB.studyPlans);
  flashcardSyncState = tableAdapter(offlineDB.flashcardSyncState);
  studyGuides = tableAdapter(offlineDB.studyGuides);
  lessonCache = tableAdapter(offlineDB.lessonCache);
  teacherObservations = tableAdapter(offlineDB.teacherObservations);
  assignmentMessages = tableAdapter(offlineDB.assignmentMessages);
  dictionaryCache = tableAdapter(offlineDB.dictionaryCache);
  storyCache = tableAdapter(offlineDB.storyCache);
  storyQuestions = tableAdapter(offlineDB.storyQuestions);
  storyProgress = tableAdapter(offlineDB.storyProgress);
  vocabularyList = tableAdapter(offlineDB.vocabularyList);
  lessonProgress = tableAdapter(offlineDB.lessonProgress);
  onboardingState = tableAdapter(offlineDB.onboardingState);
  competitionScores = tableAdapter(offlineDB.competitionScores);
  pronunciationHistory = tableAdapter(offlineDB.pronunciationHistory);
  sttCache = tableAdapter(offlineDB.sttCache);
  sttUsage = tableAdapter(offlineDB.sttUsage);
  syncOutbox = tableAdapter(offlineDB.syncOutbox);
  syncCheckpoints = tableAdapter(offlineDB.syncCheckpoints);
  userSettings = tableAdapter(offlineDB.userSettings);
  studyCommitments = tableAdapter(offlineDB.studyCommitments);
  webhookEndpoints = tableAdapter(offlineDB.webhookEndpoints);
  webhookDeliveries = tableAdapter(offlineDB.webhookDeliveries);
}

export const dexieDataAccess =
  typeof window !== "undefined" ? new DexieDataAccess() : (undefined as unknown as DexieDataAccess);
