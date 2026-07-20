import Dexie, { type Table } from "dexie";

import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type { DictionaryCacheEntry } from "@/lib/dictionary/types";
import type { QuestionEmbedding } from "@/lib/embedding/types";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import type { FlashcardReview, FlashcardSM2 } from "@/lib/flashcard-engine/types";
import type { StoredGamification } from "@/lib/gamification-engine/types";
import type { CachedGraph } from "@/lib/knowledge-graph/types";
import type { CachedLesson } from "@/lib/lesson/types";
import type { JobRecord } from "@/lib/orchestrator/types";
import type { QuizPack, QuizPackQuestion, QuizPackVisualAsset } from "@/lib/quiz-packs/types";
import type { CachedStory, StoryQuestionSet } from "@/lib/stories/types";
import type {
  GroupBadge,
  GroupChallenge,
  GroupChallengeEntry,
} from "@/lib/study-groups/challenge-types";
import type { GroupPost } from "@/lib/study-groups/types";
import type { CachedStudyGuide } from "@/lib/study-guide/types";
import type { TinyFishCacheEntry, TinyFishUsageEntry } from "@/lib/tinyfish/cache";
import type { WebhookDelivery, WebhookEndpoint } from "@/lib/webhooks/types";
import type { UserConsent } from "@/types/user-consent";

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
  DeprecatedQuestion,
  DexieGroupComment,
  DexieGroupReaction,
  EssayDraftRecord,
  ExamSessionSnapshot,
  ExtractionCache,
  FlashcardSyncState,
  InvoiceRecord,
  LessonProgress,
  LicenseRecord,
  MatricResult,
  NoteRecord,
  OnboardingState,
  PronunciationScoreRecord,
  QuestionRating,
  QuizAttempt,
  QuizSessionState,
  RetentionRecurrence,
  SchoolCodeRecord,
  SchoolMemberRecord,
  SchoolRecord,
  SeenPastPaperQuestion,
  SharedQuestionRecord,
  StoryProgressRecord,
  StudyCommitmentRecord,
  StudyPlanRecord,
  SyncCheckpoint,
  SyncConflict,
  SyncOutboxEntry,
  TeacherObservation,
  VocabularyEntry,
  WrongAnswerEntry,
  STTCacheEntry,
  STTUsageEntry,
  UserSettings,
  SrDailyBudget,
} from "./types";

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
  packVisualAssets!: Table<QuizPackVisualAsset, number>;
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
  webhookEndpoints!: Table<WebhookEndpoint, string>;
  webhookDeliveries!: Table<WebhookDelivery, number>;
  schools!: Table<SchoolRecord, string>;
  schoolMembers!: Table<SchoolMemberRecord, number>;
  schoolCodes!: Table<SchoolCodeRecord, string>;
  licenses!: Table<LicenseRecord, string>;
  invoices!: Table<InvoiceRecord, string>;
  deprecatedQuestions!: Table<DeprecatedQuestion, string>;
  matricResults!: Table<MatricResult, number>;

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
      packVisualAssets: "++id, &[packId+questionIndex], packId, createdAt",
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

    // v48: webhook endpoint registry + delivery tracking
    this.version(48).stores({
      webhookEndpoints: "id, url, enabled, createdAt",
      webhookDeliveries: "++id, endpointId, event, status, createdAt",
    });

    // v49: deprecatedQuestions + matricResults
    this.version(49).stores({
      deprecatedQuestions: "&questionId, deprecatedAt",
      matricResults:
        "++id, candidateNumber, examYear, examSession, subject, &[candidateNumber+examYear+subject]",
    });
  }
}
