import Dexie, { type Table } from "dexie";

export type ErrorType =
  | "concept-misunderstanding"
  | "calculation-error"
  | "misread-question"
  | "careless-mistake"
  | "time-pressure"
  | "unknown";

export interface WrongAnswerEntry {
  id?: number;
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  correctAnswer: string;
  userAnswer: string;
  explanation: string;
  createdAt: number;
  reviewed: boolean;
  errorType?: ErrorType;
}

export const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  "concept-misunderstanding": "Concept Misunderstanding",
  "calculation-error": "Calculation Error",
  "misread-question": "Misread Question",
  "careless-mistake": "Careless Mistake",
  "time-pressure": "Time Pressure",
  unknown: "Unknown",
};

export interface AnalyticsEvent {
  id?: number;
  eventType: "session_start" | "session_end" | "day_active" | "week_active";
  userId: string;
  sessionId?: string;
  metadata?: string; // JSON stringified
  timestamp: number;
}

export interface RetentionRecurrence {
  id?: number;
  questionId: string;
  userId?: string;
  subject: string;
  topic: string;
  questionText: string;
  correctAnswer: string;
  explanation: string;
  scheduledAt: number;
  answeredAt?: number;
  isCorrect?: boolean;
  completed: boolean;
}

import type { CompetencyRecord } from "@/lib/competency-engine/types";
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
import type {
  GroupBadge,
  GroupChallenge,
  GroupChallengeEntry,
} from "@/lib/study-groups/challenge-types";
import type { GroupPost } from "@/lib/study-groups/types";
import type { CachedStudyGuide } from "@/lib/study-guide/types";
import type { TinyFishCacheEntry, TinyFishUsageEntry } from "@/lib/tinyfish/cache";
import type { UserConsent } from "@/types/user-consent";

export interface CachedQuestion {
  id?: number;
  subject: string;
  topic?: string;
  questions: string; // JSON stringified QAQuestion[]
  cachedAt: number;
}

export interface CachedProgress {
  id?: number;
  odSubjectId: string;
  userId?: string;
  questionsAttempted: number;
  correctCount: number;
  currentStreak: number;
  longestStreak: number;
  updatedAt: number;
}

export interface QuizAttempt {
  id?: number;
  odSubject: string;
  userId?: string;
  answers: string; // JSON stringified answers
  score: number;
  maxScore?: number;
  totalQuestions: number;
  duration: number;
  completedAt: number;
}

export interface SyncConflict {
  id: number;
  localData: unknown;
  serverData: unknown;
  conflictType: "progress" | "attempt" | "preference";
  resolvedAt?: number;
  resolution?: "local" | "server" | "merged";
}

export interface CachedSubject {
  id?: number;
  code: string;
  name: string;
  category: string;
  data: string; // JSON stringified subject data
  cachedAt: number;
}

export interface QuizAnswer {
  questionId: string;
  selectedOption: string | null;
  isCorrect: boolean | null;
  answeredAt: number;
  timeSpent: number;
}

export interface CachedVisual {
  id?: number;
  cacheKey: string;
  subject: string;
  visual: string; // JSON stringified VisualContent | null
  createdAt: number;
  expiresAt: number;
}

export interface ChatMessageRecord {
  id?: number;
  messageId: string;
  role: "user" | "assistant";
  content: string;
  type?: string;
  timestamp: number;
}

export interface QuestionRating {
  id?: number;
  questionId: string;
  subject: string;
  topic?: string;
  rating: number; // 1-5
  feedback?: string;
  createdAt: number;
}

export interface QuizSessionState {
  id?: number;
  sessionId: string;
  subject: string;
  topic?: string;
  questions: string; // JSON stringified QAQuestion[]
  answers: QuizAnswer[];
  currentIndex: number;
  startedAt: number;
  lastSavedAt: number;
  isPaused: boolean;
  duration: number;
}

export interface ExamSessionSnapshot {
  id?: number;
  paperId: string;
  answers: string; // JSON stringified Record<string, ExamAnswer>
  flags: string; // JSON stringified string[]
  currentPartId: string | null;
  timeRemaining: number;
  startedAt: number;
  lastSavedAt: number;
  completed: boolean;
}

export interface CachedPdf {
  id?: number;
  paperId: string;
  pdfData: Blob;
  fileName: string;
  cachedAt: number;
}

export interface CachedExamDates {
  id?: number;
  cacheKey: string;
  session: string;
  year: number;
  slots: string;
  updatedAt: number;
}

export interface DexieGroupComment {
  id?: number;
  postId: string;
  userId: string;
  userName?: string;
  content: string;
  parentId?: string;
  createdAt: string;
}

export interface DexieGroupReaction {
  id?: number;
  postId?: string;
  commentId?: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface ExtractionCache {
  id?: number;
  imageHash: string;
  extractedText: string;
  subject?: string;
  createdAt: number;
}

export interface BookmarkRecord {
  id?: number;
  questionId: string;
  questionText: string;
  subject: string;
  topic: string;
  note?: string;
  savedAt: number;
}

export interface NoteRecord {
  id?: number;
  uuid: string;
  title: string;
  content: string;
  tags?: string[];
  subject?: string;
  topic?: string;
  isFavorite?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export interface SharedQuestionRecord {
  id: string;
  question: JsonValue;
  subject: string;
  topic: string;
  sharedById: string;
  sharedAt: number;
  viewCount: number;
  sources?: { url: string; title: string }[];
}

export interface TeacherObservation {
  id?: number;
  studentId: string;
  teacherId: string;
  content: string;
  subject?: string;
  createdAt: number;
}

export interface AssignmentMessage {
  id?: number;
  assignmentId: string;
  senderId: string;
  senderRole: "teacher" | "student";
  content: string;
  createdAt: number;
}

export interface StudyPlanRecord {
  id: string;
  plan: string; // JSON serialized StudyPlan
  updatedAt: number;
}

export interface OnboardingState {
  userId: string;
  hasVisited: boolean;
  firstVisitsRemaining: number;
  onboardingData: string; // JSON
  updatedAt: number;
}

export interface VocabularyEntry {
  id?: number;
  userId: string;
  word: string;
  definition: string;
  language: string;
  partOfSpeech?: string;
  sourceType: "lesson" | "story" | "manual";
  sourceId: string;
  sourceLesson?: string;
  addedAt: number;
  reviewCount: number;
  lastReviewedAt?: number;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completedSections: number;
  completedSectionIds: string;
  totalSections: number;
  completedAt: number;
  score?: number;
}

export interface SrDailyBudget {
  userId: string;
  date: string;
  newCardsUsed: number;
  reviewsUsed: number;
}

export interface FlashcardSyncState {
  userId: string;
  lastSyncTimestamp: number;
}

export interface SeenPastPaperQuestion {
  id?: number;
  questionId: string;
  subject: string;
  seenAt: number;
}

export interface StoryProgressRecord {
  id?: number;
  userId: string;
  storyId: string;
  scrollPercent: number;
  completed: boolean;
  lastReadAt: number;
  timeSpentSeconds: number;
}

export interface EssayDraftRecord {
  id?: number;
  userId: string;
  questionId: string;
  draftNumber: number;
  content: string;
  aiFeedback: string;
  score: number;
  maxScore: number;
  createdAt: number;
}

export interface CompetitionScoreRecord {
  id?: number;
  userId: string;
  weekStart: string;
  weekEnd: string;
  xpEarned: number;
  subjectId?: string;
  updatedAt: number;
}

export interface PronunciationScoreRecord {
  id?: number;
  userId: string;
  word: string;
  overallScore: number;
  wordAccuracy: number;
  phonemeAccuracy: number;
  fluencyScore: number;
  language: string;
  attemptedAt: number;
}

export interface STTCacheEntry {
  key: string;
  result: string;
  expiresAt: number;
}

export interface STTUsageEntry {
  id?: number;
  date: string;
  provider: string;
  minutes: number;
  cost: number;
}

export interface SyncOutboxEntry {
  id?: number;
  table: string;
  recordId: string;
  operation: "create" | "update" | "delete";
  data: string;
  createdAt: number;
  retries: number;
}

export interface SyncCheckpoint {
  table: string;
  lastPulledAt: number;
  lastPulledVersion: string;
}

export interface StudyCommitmentRecord {
  id?: number;
  userId: string;
  buddyUserId: string;
  subject: string;
  targetDailyMinutes: number;
  startDate: string;
  endDate: string | null;
  status: "pending" | "active" | "declined" | "ended";
  sharedStreak: number;
  lastSharedDate: string | null;
  createdAt: string;
}

export interface SchoolRecord {
  id: string;
  name: string;
  domain?: string;
  licenseTier: "free" | "standard" | "premium";
  billingStatus: "active" | "trialing" | "past_due" | "cancelled" | "suspended";
  seatCount: number;
  seatsUsed: number;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolMemberRecord {
  id?: number;
  schoolId: string;
  userId: string;
  role: "admin" | "teacher" | "student" | "billing" | "teacher_manager";
  status: "active" | "invited" | "removed";
  invitedBy?: string;
  grade?: string;
  joinedAt: string;
  createdAt: string;
}

export interface SchoolCodeRecord {
  code: string;
  schoolId: string;
  type: "teacher" | "student";
  maxUses?: number;
  useCount: number;
  expiresAt?: string;
  createdBy: string;
  createdAt: string;
}

export interface LicenseRecord {
  id: string;
  schoolId: string;
  tier: "standard" | "premium";
  status: "active" | "trialing" | "past_due" | "cancelled" | "expired" | "pending";
  startDate: string;
  endDate: string;
  autoRenew: boolean;
  stripeSubscriptionId?: string;
  payfastToken?: string;
  provider?: "stripe" | "payfast";
  seatCount: number;
  unitPrice: number;
  totalPrice: number;
  cancelledAt?: string;
  createdAt: string;
}

export interface InvoiceRecord {
  id: string;
  schoolId: string;
  licenseId: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "failed" | "refunded";
  paidAt?: string;
  periodStart: string;
  periodEnd: string;
  stripeInvoiceId?: string;
  payfastPaymentId?: string;
  lines?: string;
  downloadUrl?: string;
  createdAt: string;
}

export interface UserSettings {
  id?: string;
  userId: string;
  studyPrefs: string;
  notifications: string;
  betaFeatures?: string;
  updatedAt: number;
}

export class LumniOfflineDB extends Dexie {
  pronunciationHistory!: Table<PronunciationScoreRecord, number>;
  chatMessages!: Table<ChatMessageRecord, number>;
  questions!: Table<CachedQuestion, number>;
  progress!: Table<CachedProgress, number>;
  quizAttempts!: Table<QuizAttempt, number>;
  subjects!: Table<CachedSubject, number>;
  quizSessions!: Table<QuizSessionState, number>;
  conflicts!: Table<SyncConflict, number>;
  jobs!: Table<JobRecord, number>;
  competencies!: Table<CompetencyRecord, number>;
  visuals!: Table<CachedVisual, number>;
  wrongAnswers!: Table<WrongAnswerEntry, number>;
  questionRatings!: Table<QuestionRating, number>;
  flashcards!: Table<FlashcardSM2, string>;
  examSessions!: Table<ExamSessionSnapshot, number>;
  cachedPdfs!: Table<CachedPdf, number>;
  examDates!: Table<CachedExamDates, number>;
  reviewHistory!: Table<FlashcardReview, number>;
  extractionCache!: Table<ExtractionCache, number>;
  bookmarks!: Table<BookmarkRecord, number>;
  notes!: Table<NoteRecord, number>;
  groupPosts!: Table<GroupPost, number>;
  groupComments!: Table<DexieGroupComment, number>;
  groupReactions!: Table<DexieGroupReaction, number>;
  gamification!: Table<StoredGamification, number>;
  quizPacks!: Table<QuizPack, string>;
  packQuestions!: Table<QuizPackQuestion, number>;
  pastPaperQuestions!: Table<PastPaperQuestion, string>;
  groupChallenges!: Table<GroupChallenge, string>;
  groupChallengeEntries!: Table<GroupChallengeEntry, string>;
  groupBadges!: Table<GroupBadge, string>;
  userConsents!: Table<UserConsent, string>;
  tinyfishCache!: Table<TinyFishCacheEntry, string>;
  tinyfishUsage!: Table<TinyFishUsageEntry, number>;
  analyticsEvents!: Table<AnalyticsEvent, number>;
  retentionRecurrence!: Table<RetentionRecurrence, number>;
  sharedQuestions!: Table<SharedQuestionRecord, string>;
  knowledgeGraph!: Table<CachedGraph, string>;
  teacherObservations!: Table<TeacherObservation, number>;
  assignmentMessages!: Table<AssignmentMessage, number>;
  studyPlans!: Table<StudyPlanRecord, string>;
  onboardingState!: Table<OnboardingState, string>;
  srDailyBudget!: Table<SrDailyBudget, string>;
  flashcardSyncState!: Table<FlashcardSyncState, string>;
  studyGuides!: Table<CachedStudyGuide, string>;
  lessonCache!: Table<CachedLesson, string>;
  questionEmbeddings!: Table<QuestionEmbedding, string>;
  dictionaryCache!: Table<DictionaryCacheEntry, string>;
  vocabularyList!: Table<VocabularyEntry, number>;
  lessonProgress!: Table<LessonProgress, string>;
  storyCache!: Table<CachedStory, string>;
  storyQuestions!: Table<StoryQuestionSet, string>;
  seenPastPaperQuestions!: Table<SeenPastPaperQuestion, number>;
  storyProgress!: Table<StoryProgressRecord, number>;
  competitionScores!: Table<CompetitionScoreRecord, number>;
  sttCache!: Table<STTCacheEntry, string>;
  sttUsage!: Table<STTUsageEntry, number>;
  syncOutbox!: Table<SyncOutboxEntry, number>;
  syncCheckpoints!: Table<SyncCheckpoint, string>;
  userSettings!: Table<UserSettings, string>;
  essayDrafts!: Table<EssayDraftRecord, number>;
  studyCommitments!: Table<StudyCommitmentRecord, number>;
  schools!: Table<SchoolRecord, string>;
  schoolMembers!: Table<SchoolMemberRecord, number>;
  schoolCodes!: Table<SchoolCodeRecord, string>;
  licenses!: Table<LicenseRecord, string>;
  invoices!: Table<InvoiceRecord, string>;

  constructor() {
    super("lumni-offline");

    // Consolidated base at v35: contains all tables from v1-v34
    this.version(35).stores({
      flashcards:
        "&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
      reviewHistory: "++id, cardId, reviewedAt",
      extractionCache: "++id, &imageHash, createdAt",
      chatMessages: "++id, role, timestamp",
      questions: "++id, subject, topic, cachedAt",
      progress: "++id, &odSubjectId, userId, updatedAt",
      quizAttempts: "++id, &odSubject, userId, completedAt",
      subjects: "++id, &code, cachedAt",
      quizSessions: "++id, &sessionId, subject, startedAt, lastSavedAt",
      conflicts: "++id, resolvedAt",
      jobs: "++id, type, status, priority, scheduledAt, createdAt",
      competencies: "++id, subjectId, topicId, bloomLevel, level, lastAssessed",
      visuals: "++id, &cacheKey, subject, createdAt",
      wrongAnswers: "++id, userId, subject, topic, reviewed, createdAt",
      questionRatings: "++id, questionId, subject, topic, rating, createdAt",
      examSessions: "++id, &paperId, startedAt, lastSavedAt, completed",
      cachedPdfs: "++id, &paperId, cachedAt",
      examDates: "++id, &cacheKey, session, year, updatedAt",
      bookmarks: "++id, &questionId, subject, topic, savedAt",
      notes: "++id, title, subject, topic, isFavorite, updatedAt",
      groupPosts: "++id, groupId, userId, createdAt",
      groupComments: "++id, postId, parentId, userId, createdAt",
      groupReactions: "++id, postId, commentId, userId, emoji, createdAt",
      gamification: "++id, totalXp, currentStreak, lastPracticeDate",
      quizPacks: "&id, subject, topic, status, createdAt, expiresAt",
      packQuestions: "++id, &[packId+questionIndex], packId",
      pastPaperQuestions: "&id, subject, year, paperNumber, questionType, createdAt",
      groupChallenges: "&id, groupId, weekStart, status",
      groupChallengeEntries: "&id, challengeId, groupId, userId",
      groupBadges: "&id, groupId, userId, tier",
      userConsents: "&userId, updatedAt",
      tinyfishCache: "&key, expiresAt",
      tinyfishUsage: "++id, &[userId+date], userId, date",
      analyticsEvents: "++id, eventType, userId, timestamp",
      retentionRecurrence: "++id, questionId, userId, scheduledAt, completed",
      sharedQuestions: "&id, subject, topic, sharedById, sharedAt",
      knowledgeGraph: "&key, expiresAt",
      teacherObservations: "++id, studentId, teacherId, subject, createdAt",
      assignmentMessages: "++id, &assignmentId, senderId, senderRole, createdAt",
      studyPlans: "&id, updatedAt",
      onboardingState: "&userId, updatedAt",
      srDailyBudget: "&userId, date, newCardsUsed, reviewsUsed",
      flashcardSyncState: "&userId, lastSyncTimestamp",
      studyGuides: "&key, expiresAt",
      questionEmbeddings: "&id, subject, updatedAt",
      lessonCache: "&key, expiresAt",
      dictionaryCache: "&key, word, expiresAt",
      storyCache: "&key, expiresAt",
      storyQuestions: "&storyId, expiresAt",
    });

    // v36: vocabularyList + lessonProgress
    this.version(36).stores({
      vocabularyList: "++id, userId, word, language, sourceType, sourceId, addedAt, reviewCount",
      lessonProgress: "&[userId+lessonId], userId, lessonId, completedAt, score",
    });

    // v37: seenPastPaperQuestions for adaptive quiz dedup
    this.version(37).stores({
      seenPastPaperQuestions: "++id, &questionId, subject, seenAt",
    });

    // v38: storyProgress for reading progress tracking
    this.version(38).stores({
      storyProgress: "++id, &[userId+storyId], userId, storyId, completed, lastReadAt",
    });

    // v39: competitionScores for weekly competition leaderboards
    this.version(39).stores({
      competitionScores: "++id, userId, weekStart, weekEnd, xpEarned",
    });

    // v40: pronunciationHistory for tracking pronunciation practice scores
    this.version(40).stores({
      pronunciationHistory: "++id, userId, word, language, attemptedAt",
    });

    // v41: sttCache (speech-to-text result cache), sttUsage (cost tracking),
    // syncOutbox (pending outbound changes), syncCheckpoints (pull positions)
    this.version(41).stores({
      sttCache: "&key, expiresAt",
      sttUsage: "++id, date, provider",
      syncOutbox: "++id, table, operation, createdAt",
      syncCheckpoints: "&table, lastPulledAt",
    });

    // v42: userSettings for cross-device preference persistence
    this.version(42).stores({
      userSettings: "&userId, updatedAt",
    });

    // v43: essayDrafts for essay coaching revision tracking
    this.version(43).stores({
      essayDrafts: "++id, userId, questionId, [userId+questionId]",
    });

    // v45: studyCommitments for study buddy accountability
    this.version(45).stores({
      studyCommitments:
        "++id, &[userId+buddyUserId+subject], userId, buddyUserId, status, createdAt",
    });

    // v46: school licensing tables
    this.version(46).stores({
      schools: "&id, domain, name, licenseTier, billingStatus, createdAt",
      schoolMembers: "++id, &[schoolId+userId], schoolId, userId, role, status",
      schoolCodes: "&code, schoolId, type, expiresAt",
      licenses: "&id, schoolId, status, tier, startDate, endDate, stripeSubscriptionId",
      invoices: "&id, schoolId, status, licenseId, createdAt",
    });

    // v47: compound index on vocabularyList for efficient single-record lookups
    this.version(47).stores({
      vocabularyList:
        "++id, &[userId+word], userId, word, language, sourceType, sourceId, addedAt, reviewCount",
    });
  }
}

let _offlineDB: LumniOfflineDB | undefined;

function noopTable(): unknown {
  return new Proxy(
    {},
    {
      get(_t, prop: string) {
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
        const chainable = [
          "where",
          "filter",
          "equals",
          "above",
          "below",
          "startsWithAnyOf",
          "anyOf",
          "limit",
          "offset",
          "reverse",
          "and",
          "or",
          "clone",
          "distinct",
          "each",
          "eachKey",
          "eachPrimaryKey",
          "eachUniqueKey",
          "first",
          "last",
        ];
        if (chainable.includes(prop)) return () => noopTable();
        return async (..._a: unknown[]) => {
          if (prop === "toArray") return [];
          if (prop === "get") return undefined;
          if (prop === "count") return 0;
          if (prop === "keys") return [];
          if (prop === "primaryKeys") return [];
          if (prop === "bulkAdd") return [];
          if (prop === "bulkPut") return [];
          if (prop === "bulkDelete") return [];
          if (prop === "put" || prop === "add") return undefined;
          if (prop === "delete" || prop === "clear") return undefined;
          if (prop === "update") return 0;
          if (prop === "modify") return 0;
          if (prop === "sortBy") return [];
          if (prop === "toCollection") return noopTable();
          return undefined;
        };
      },
    },
  );
}

function createOfflineDBProxy(): LumniOfflineDB {
  if (typeof window === "undefined") {
    return new Proxy({} as unknown as LumniOfflineDB, {
      get(_t, prop: string) {
        if (prop === "then" || prop === "catch" || prop === "finally") return undefined;
        if (prop === "version" || prop === "verno" || prop === "name") return 0;
        if (prop === "isOpen") return () => false;
        if (prop === "open" || prop === "close" || prop === "delete") return async () => undefined;
        if (prop === "on" || prop === "table") return () => noopTable();
        if (prop === "tables") return [];
        if (prop === "transaction") return async (_r: unknown, f: () => Promise<void>) => f();
        return noopTable();
      },
    }) as unknown as LumniOfflineDB;
  }
  return new LumniOfflineDB();
}

export const offlineDB = createOfflineDBProxy();
