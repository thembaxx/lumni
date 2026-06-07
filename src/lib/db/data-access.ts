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
	DexieGroupComment,
	DexieGroupReaction,
	ExamSessionSnapshot,
	ExtractionCache,
	FlashcardSyncState,
	NoteRecord,
	OnboardingState,
	QuestionRating,
	QuizAttempt,
	QuizSessionState,
	RetentionRecurrence,
	SharedQuestionRecord,
	SrDailyBudget,
	StudyPlanRecord,
	SyncConflict,
	TeacherObservation,
} from "@/lib/db/schema";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import type {
	FlashcardReview,
	FlashcardSM2,
} from "@/lib/flashcard-engine/types";
import type { StoredGamification } from "@/lib/gamification-engine/types";
import type { CachedGraph } from "@/lib/knowledge-graph/types";
import type { JobRecord } from "@/lib/orchestrator/types";
import type { QuizPack, QuizPackQuestion } from "@/lib/quiz-packs/types";
import type {
	GroupBadge,
	GroupChallenge,
	GroupChallengeEntry,
} from "@/lib/study-groups/challenge-types";
import type { GroupPost } from "@/lib/study-groups/types";
import type { CachedStudyGuide } from "@/lib/study-guide/types";
import type {
	TinyFishCacheEntry,
	TinyFishUsageEntry,
} from "@/lib/tinyfish/cache";
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
// DataAccess seam — one accessor per table
// ──────────────────────────────────────────────

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
	bookmarks: DataAccessTable<BookmarkRecord, number>;
	questions: DataAccessTable<CachedQuestion, number>;
	subjects: DataAccessTable<CachedSubject, number>;
	visuals: DataAccessTable<CachedVisual, number>;
	// Phase 3 — expanded tables for remaining offlineDB consumers
	chatMessages: DataAccessTable<ChatMessageRecord, number>;
	questionRatings: DataAccessTable<QuestionRating, number>;
	knowledgeGraph: DataAccessTable<CachedGraph, string>;
	examSessions: DataAccessTable<ExamSessionSnapshot, number>;
	sharedQuestions: DataAccessTable<SharedQuestionRecord, string>;
	examDates: DataAccessTable<CachedExamDates, number>;
	extractionCache: DataAccessTable<ExtractionCache, number>;
	notes: DataAccessTable<NoteRecord, number>;
	gamification: DataAccessTable<StoredGamification, number>;
	cachedPdfs: DataAccessTable<CachedPdf, number>;
	quizSessions: DataAccessTable<QuizSessionState, number>;
	tinyfishCache: DataAccessTable<TinyFishCacheEntry, string>;
	tinyfishUsage: DataAccessTable<TinyFishUsageEntry, number>;
	pastPaperQuestions: DataAccessTable<PastPaperQuestion, string>;
	jobs: DataAccessTable<JobRecord, number>;
	conflicts: DataAccessTable<SyncConflict, number>;
	// Phase 1 — remaining tables for full coverage
	userConsents: DataAccessTable<UserConsent, string>;
	groupPosts: DataAccessTable<GroupPost, number>;
	groupComments: DataAccessTable<DexieGroupComment, number>;
	groupReactions: DataAccessTable<DexieGroupReaction, number>;
	groupChallenges: DataAccessTable<GroupChallenge, string>;
	groupChallengeEntries: DataAccessTable<GroupChallengeEntry, string>;
	groupBadges: DataAccessTable<GroupBadge, string>;
	teacherObservations: DataAccessTable<TeacherObservation, number>;
	assignmentMessages: DataAccessTable<AssignmentMessage, number>;
	studyPlans: DataAccessTable<StudyPlanRecord, string>;
	onboardingState: DataAccessTable<OnboardingState, string>;
	srDailyBudget: DataAccessTable<SrDailyBudget, string>;
	flashcardSyncState: DataAccessTable<FlashcardSyncState, string>;
	studyGuides: DataAccessTable<CachedStudyGuide, string>;
}
