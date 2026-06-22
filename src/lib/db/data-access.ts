import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type {
  AnalyticsEvent,
  AssignmentMessage,
  BookmarkRecord,
  CachedExamDates,
  CachedPdf,
  CachedProgress,
  CachedQuestion,
  CachedSubject,
  CachedVisual,
  ChatMessageRecord,
  CompetitionScoreRecord,
  ExamSessionSnapshot,
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
  StoryProgressRecord,
  StudyPlanRecord,
  SyncConflict,
  TeacherObservation,
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
// Generic query interfaces
// ──────────────────────────────────────────────

export interface Collection<T> {
  first(): Promise<T | undefined>;
  toArray(): Promise<T[]>;
  count(): Promise<number>;
  delete(): Promise<void>;
  modify(changes: Partial<T> | ((record: T) => void)): Promise<number>;
  reverse(): Collection<T>;
  limit(n: number): Collection<T>;
  offset(n: number): Collection<T>;
  filter(pred: (item: T) => boolean): Collection<T>;
  sortBy(index: string): Promise<T[]>;
}

export interface WhereClause<T> {
  equals(val: unknown): Collection<T>;
  belowOrEqual(val: unknown): Collection<T>;
  below(val: unknown): Collection<T>;
  startsWith(val: string): Collection<T>;
  anyOf(vals: unknown[]): Collection<T>;
}

// ──────────────────────────────────────────────
// Generic table interface
// ──────────────────────────────────────────────

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

// ──────────────────────────────────────────────
// Domain sub-interfaces
// ──────────────────────────────────────────────

export interface FlashcardDataAccess {
  flashcards: DataAccessTable<FlashcardSM2, string>;
  reviewHistory: DataAccessTable<FlashcardReview, number>;
}

export interface CompetencyDataAccess {
  competencies: DataAccessTable<CompetencyRecord, number>;
  progress: DataAccessTable<CachedProgress, number>;
  quizAttempts: DataAccessTable<QuizAttempt, number>;
}

export interface QuizDataAccess {
  questions: DataAccessTable<CachedQuestion, number>;
  quizPacks: DataAccessTable<QuizPack, string>;
  packQuestions: DataAccessTable<QuizPackQuestion, number>;
  quizSessions: DataAccessTable<QuizSessionState, number>;
}

export interface ContentDataAccess {
  notes: DataAccessTable<NoteRecord, number>;
  bookmarks: DataAccessTable<BookmarkRecord, number>;
  sharedQuestions: DataAccessTable<SharedQuestionRecord, string>;
  visuals: DataAccessTable<CachedVisual, number>;
  cachedPdfs: DataAccessTable<CachedPdf, number>;
  extractionCache: DataAccessTable<ExtractionCache, number>;
}

export interface StudyDataAccess {
  studyPlans: DataAccessTable<StudyPlanRecord, string>;
  studyGuides: DataAccessTable<CachedStudyGuide, string>;
  examDates: DataAccessTable<CachedExamDates, number>;
}

export interface LessonDataAccess {
  lessonCache: DataAccessTable<CachedLesson, string>;
}

export interface DictionaryDataAccess {
  dictionaryCache: DataAccessTable<DictionaryCacheEntry, string>;
}

export interface StoryDataAccess {
  storyCache: DataAccessTable<CachedStory, string>;
  storyQuestions: DataAccessTable<StoryQuestionSet, string>;
  storyProgress: DataAccessTable<StoryProgressRecord, number>;
}

export interface SyncDataAccess {
  wrongAnswers: DataAccessTable<WrongAnswerEntry, number>;
  retentionRecurrence: DataAccessTable<RetentionRecurrence, number>;
  examSessions: DataAccessTable<ExamSessionSnapshot, number>;
  chatMessages: DataAccessTable<ChatMessageRecord, number>;
  questionRatings: DataAccessTable<QuestionRating, number>;
  jobs: DataAccessTable<JobRecord, number>;
  conflicts: DataAccessTable<SyncConflict, number>;
  flashcardSyncState: DataAccessTable<FlashcardSyncState, string>;
  teacherObservations: DataAccessTable<TeacherObservation, number>;
  assignmentMessages: DataAccessTable<AssignmentMessage, number>;
  onboardingState: DataAccessTable<OnboardingState, string>;
}

export interface VocabularyDataAccess {
  vocabularyList: DataAccessTable<VocabularyEntry, number>;
  lessonProgress: DataAccessTable<LessonProgress, string>;
}

export interface ObservabilityDataAccess {
  analyticsEvents: DataAccessTable<AnalyticsEvent, number>;
  gamification: DataAccessTable<StoredGamification, number>;
}

export interface SocialDataAccess {
  userConsents: DataAccessTable<UserConsent, string>;
}

export interface CacheDataAccess {
  tinyfishCache: DataAccessTable<TinyFishCacheEntry, string>;
  tinyfishUsage: DataAccessTable<TinyFishUsageEntry, number>;
  knowledgeGraph: DataAccessTable<CachedGraph, string>;
}

export interface EmbeddingDataAccess {
  questionEmbeddings: DataAccessTable<QuestionEmbedding, string>;
}

export interface CommunityDataAccess {
  competitionScores: DataAccessTable<CompetitionScoreRecord, number>;
}

export interface LegacyDataAccess {
  subjects: DataAccessTable<CachedSubject, number>;
  pastPaperQuestions: DataAccessTable<PastPaperQuestion, string>;
  seenPastPaperQuestions: DataAccessTable<SeenPastPaperQuestion, number>;
}

// ──────────────────────────────────────────────
// Composite — full 34-table access
// ──────────────────────────────────────────────

export interface DataAccess
  extends
    FlashcardDataAccess,
    CompetencyDataAccess,
    QuizDataAccess,
    ContentDataAccess,
    StudyDataAccess,
    LessonDataAccess,
    DictionaryDataAccess,
    StoryDataAccess,
    VocabularyDataAccess,
    SyncDataAccess,
    ObservabilityDataAccess,
    SocialDataAccess,
    CacheDataAccess,
    EmbeddingDataAccess,
    CommunityDataAccess,
    LegacyDataAccess {}
