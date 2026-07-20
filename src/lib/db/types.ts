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

export interface DeprecatedQuestion {
  questionId: string;
  deprecatedAt: number;
}

export interface MatricResult {
  candidateNumber: string;
  firstName: string;
  lastName: string;
  examYear: number;
  examSession: string;
  subject: string;
  subjectCode?: string;
  paperNumber?: number;
  mark: number;
  outOf: number;
  level: number;
  achievement: string;
  schoolName?: string;
  centreNumber?: string;
}
