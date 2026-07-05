import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { Collection, DataAccess, DataAccessTable, WhereClause } from "@/lib/db/data-access";
import type {
  AnalyticsEvent,
  AssignmentMessage,
  BookmarkRecord,
  ExperimentAssignmentRecord,
  CachedExamDates,
  CachedPdf,
  CachedProgress,
  CachedQuestion,
  CachedSubject,
  CachedVisual,
  ChatMessageRecord,
  CompetitionScoreRecord,
  EssayDraftRecord,
  ExamSessionSnapshot,
  PronunciationScoreRecord,
  ExtractionCache,
  FlashcardSyncState,
  LessonProgress,
  NoteRecord,
  OnboardingState,
  QuestionRating,
  QuizAttempt,
  QuizSessionState,
  RetentionRecurrence,
  SeenPastPaperQuestion,
  SharedQuestionRecord,
  STTCacheEntry,
  STTUsageEntry,
  StoryProgressRecord,
  StudyPlanRecord,
  SyncCheckpoint,
  SyncConflict,
  SyncOutboxEntry,
  TeacherObservation,
  UserSettings,
  VocabularyEntry,
} from "@/lib/db/schema";
import type { DictionaryCacheEntry } from "@/lib/dictionary/types";
import type { QuestionEmbedding } from "@/lib/embedding/types";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import type { FlashcardReview, FlashcardSM2 } from "@/lib/flashcard-engine/types";
import type { StoredGamification } from "@/lib/gamification-engine/types";
import type { CachedGraph } from "@/lib/knowledge-graph/types";
import type { CachedLesson } from "@/lib/lesson/types";
import type { JobRecord } from "@/lib/orchestrator/types";
import type { QuizPack, QuizPackQuestion } from "@/lib/quiz-packs/types";
import type { CachedStory, StoryQuestionSet } from "@/lib/stories/types";
import type { CachedStudyGuide } from "@/lib/study-guide/types";
import type { TinyFishCacheEntry, TinyFishUsageEntry } from "@/lib/tinyfish/cache";
import type { UserConsent } from "@/types/user-consent";

// ──────────────────────────────────────────────
// Lazy-evaluated collection
// ──────────────────────────────────────────────

class InMemoryCollection<T> implements Collection<T> {
  constructor(
    private readonly getItems: () => T[],
    private readonly compareFn?: (a: T, b: T) => number,
  ) {}

  async first(): Promise<T | undefined> {
    return this.getItems()[0];
  }

  async toArray(): Promise<T[]> {
    const items = this.getItems();
    return this.compareFn ? items.toSorted(this.compareFn) : [...items];
  }

  async count(): Promise<number> {
    return this.getItems().length;
  }

  async delete(): Promise<void> {
    throw new Error("InMemory delete() not implemented — use table.delete()");
  }

  async modify(_changes: Partial<T> | ((record: T) => void)): Promise<number> {
    throw new Error("InMemory modify() not implemented — use table.update()");
  }

  reverse(): Collection<T> {
    return new InMemoryCollection(
      () => this.getItems(),
      (a, b) => -1 * (this.compareFn?.(a, b) ?? 0),
    );
  }

  toReversed(): Collection<T> {
    return this.reverse();
  }

  limit(n: number): Collection<T> {
    return new InMemoryCollection(() => this.getItems().slice(0, n));
  }

  offset(n: number): Collection<T> {
    return new InMemoryCollection(() => this.getItems().slice(n));
  }

  filter(pred: (item: T) => boolean): Collection<T> {
    return new InMemoryCollection(() => this.getItems().filter(pred));
  }

  async sortBy(index: string): Promise<T[]> {
    return this.getItems().toSorted((a, b) => {
      const av = (a as Record<string, unknown>)[index] as string | number;
      const bv = (b as Record<string, unknown>)[index] as string | number;
      if (av < bv) return -1;
      if (av > bv) return 1;
      return 0;
    });
  }
}

class InMemoryWhereClause<T> implements WhereClause<T> {
  constructor(
    private readonly getItems: () => T[],
    private readonly index: string,
  ) {}

  private filterBy(pred: (val: unknown) => boolean): InMemoryCollection<T> {
    return new InMemoryCollection(() =>
      this.getItems().filter((item) => pred((item as Record<string, unknown>)[this.index])),
    );
  }

  equals(val: unknown): Collection<T> {
    return this.filterBy((v) => v === val);
  }

  belowOrEqual(val: unknown): Collection<T> {
    return this.filterBy((v) => typeof v === "number" && typeof val === "number" && v <= val);
  }

  below(val: unknown): Collection<T> {
    return this.filterBy((v) => typeof v === "number" && typeof val === "number" && v < val);
  }

  startsWith(val: string): Collection<T> {
    return this.filterBy((v) => typeof v === "string" && v.startsWith(val));
  }

  anyOf(vals: unknown[]): Collection<T> {
    const set = new Set(vals);
    return this.filterBy((v) => set.has(v));
  }
}

// ──────────────────────────────────────────────
// In-memory table
// ──────────────────────────────────────────────

type IdType = string | number;

export class InMemoryTable<
  T extends object,
  TId extends IdType = number,
> implements DataAccessTable<T, TId> {
  private items = new Map<TId, T>();
  private nextId = 1;

  seed(data: T[]): void {
    for (const item of data) {
      const rec = item as Record<string, unknown>;
      if (rec.id != null) {
        this.items.set(rec.id as TId, item);
      } else {
        const autoId = this.nextId++ as TId;
        this.items.set(autoId, { ...item, id: autoId } as T);
      }
    }
  }

  async get(id: TId): Promise<T | undefined> {
    return this.items.get(id);
  }

  async add(item: Omit<T, "id">): Promise<TId> {
    const id = this.nextId++ as TId;
    this.items.set(id, { ...item, id } as unknown as T);
    return id;
  }

  async put(item: T): Promise<TId> {
    const rec = item as Record<string, unknown>;
    const id = (rec.id ?? this.nextId++) as TId;
    this.items.set(id, { ...item, id } as unknown as T);
    return id;
  }

  async update(id: TId, changes: Partial<T>): Promise<TId> {
    const existing = this.items.get(id);
    if (existing) {
      this.items.set(id, { ...existing, ...changes } as T);
    }
    return id;
  }

  async delete(id: TId): Promise<void> {
    this.items.delete(id);
  }

  async bulkAdd(items: Omit<T, "id">[]): Promise<TId[]> {
    return Promise.all(items.map((item) => this.add(item)));
  }

  async bulkPut(items: T[]): Promise<TId[]> {
    return Promise.all(items.map((item) => this.put(item)));
  }

  async bulkDelete(ids: TId[]): Promise<void> {
    for (const id of ids) {
      this.items.delete(id);
    }
  }

  async toArray(): Promise<T[]> {
    return [...this.items.values()];
  }

  async count(): Promise<number> {
    return this.items.size;
  }

  async clear(): Promise<void> {
    this.items.clear();
  }

  limit(n: number): Collection<T> {
    return new InMemoryCollection(() => [...this.items.values()].slice(0, n));
  }

  where(index: string): WhereClause<T> {
    return new InMemoryWhereClause(() => [...this.items.values()], index);
  }

  orderBy(index: string): Collection<T> {
    return new InMemoryCollection(
      () => [...this.items.values()],
      (a: T, b: T) => {
        const arec = a as Record<string, unknown>;
        const brec = b as Record<string, unknown>;
        const av = arec[index] as string | number;
        const bv = brec[index] as string | number;
        if (av < bv) return -1;
        if (av > bv) return 1;
        return 0;
      },
    );
  }
}

// ──────────────────────────────────────────────
// InMemoryDataAccess
// ──────────────────────────────────────────────

export class InMemoryDataAccess implements DataAccess {
  flashcards = new InMemoryTable<FlashcardSM2, string>();
  reviewHistory = new InMemoryTable<FlashcardReview>();
  analyticsEvents = new InMemoryTable<AnalyticsEvent>();
  retentionRecurrence = new InMemoryTable<RetentionRecurrence>();
  wrongAnswers = new InMemoryTable<WrongAnswerEntry>();
  quizPacks = new InMemoryTable<QuizPack, string>();
  packQuestions = new InMemoryTable<QuizPackQuestion>();
  competencies = new InMemoryTable<CompetencyRecord>();
  progress = new InMemoryTable<CachedProgress>();
  quizAttempts = new InMemoryTable<QuizAttempt>();
  bookmarks = new InMemoryTable<BookmarkRecord>();
  questions = new InMemoryTable<CachedQuestion>();
  subjects = new InMemoryTable<CachedSubject>();
  visuals = new InMemoryTable<CachedVisual>();
  chatMessages = new InMemoryTable<ChatMessageRecord>();
  questionRatings = new InMemoryTable<QuestionRating>();
  knowledgeGraph = new InMemoryTable<CachedGraph, string>();
  examSessions = new InMemoryTable<ExamSessionSnapshot>();
  sharedQuestions = new InMemoryTable<SharedQuestionRecord, string>();
  essayDrafts = new InMemoryTable<EssayDraftRecord>();
  examDates = new InMemoryTable<CachedExamDates>();
  extractionCache = new InMemoryTable<ExtractionCache>();
  notes = new InMemoryTable<NoteRecord>();
  gamification = new InMemoryTable<StoredGamification>();
  cachedPdfs = new InMemoryTable<CachedPdf>();
  quizSessions = new InMemoryTable<QuizSessionState>();
  tinyfishCache = new InMemoryTable<TinyFishCacheEntry, string>();
  tinyfishUsage = new InMemoryTable<TinyFishUsageEntry>();
  pastPaperQuestions = new InMemoryTable<PastPaperQuestion, string>();
  seenPastPaperQuestions = new InMemoryTable<SeenPastPaperQuestion, number>();
  jobs = new InMemoryTable<JobRecord>();
  conflicts = new InMemoryTable<SyncConflict>();
  userConsents = new InMemoryTable<UserConsent, string>();
  studyPlans = new InMemoryTable<StudyPlanRecord, string>();
  flashcardSyncState = new InMemoryTable<FlashcardSyncState, string>();
  studyGuides = new InMemoryTable<CachedStudyGuide, string>();
  lessonCache = new InMemoryTable<CachedLesson, string>();
  questionEmbeddings = new InMemoryTable<QuestionEmbedding, string>();
  teacherObservations = new InMemoryTable<TeacherObservation>();
  assignmentMessages = new InMemoryTable<AssignmentMessage>();
  dictionaryCache = new InMemoryTable<DictionaryCacheEntry, string>();
  storyCache = new InMemoryTable<CachedStory, string>();
  storyQuestions = new InMemoryTable<StoryQuestionSet, string>();
  storyProgress = new InMemoryTable<StoryProgressRecord>();
  vocabularyList = new InMemoryTable<VocabularyEntry>();
  lessonProgress = new InMemoryTable<LessonProgress, string>();
  onboardingState = new InMemoryTable<OnboardingState, string>();
  competitionScores = new InMemoryTable<CompetitionScoreRecord>();
  pronunciationHistory = new InMemoryTable<PronunciationScoreRecord>();
  sttCache = new InMemoryTable<STTCacheEntry, string>();
  sttUsage = new InMemoryTable<STTUsageEntry>();
  syncOutbox = new InMemoryTable<SyncOutboxEntry>();
  syncCheckpoints = new InMemoryTable<SyncCheckpoint, string>();
  userSettings = new InMemoryTable<UserSettings, string>();
  experimentAssignments = new InMemoryTable<ExperimentAssignmentRecord>();
}
