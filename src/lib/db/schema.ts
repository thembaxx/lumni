import Dexie, { type Table } from "dexie";
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";

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
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import type {
	FlashcardReview,
	FlashcardSM2,
} from "@/lib/flashcard-engine/types";
import type { StoredGamification } from "@/lib/gamification-engine/types";
import type { JobRecord } from "@/lib/orchestrator/types";
import type { QuizPack, QuizPackQuestion } from "@/lib/quiz-packs/types";
import type {
	GroupBadge,
	GroupChallenge,
	GroupChallengeEntry,
} from "@/lib/study-groups/challenge-types";
import type { GroupPost } from "@/lib/study-groups/types";
import type {
	TinyFishCacheEntry,
	TinyFishUsageEntry,
} from "@/lib/tinyfish/cache";
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
}

export class LumniOfflineDB extends Dexie {
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

	constructor() {
		super("lumni-offline");

		this.version(1).stores({
			questions: "++id, &subject, topic, cachedAt",
			progress: "++id, &odSubjectId, userId, updatedAt",
			quizAttempts: "++id, &odSubject, userId, completedAt",
			subjects: "++id, &code, cachedAt",
		});

		this.version(2).stores({
			quizSessions: "++id, &sessionId, subject, startedAt, lastSavedAt",
		});

		this.version(3).stores({
			conflicts: "++id, resolvedAt",
		});

		this.version(4).stores({
			jobs: "++id, type, status, priority, scheduledAt, createdAt",
		});

		this.version(5).stores({
			competencies: "++id, subjectId, topicId, bloomLevel, level, lastAssessed",
		});

		this.version(6).stores({
			visuals: "++id, &cacheKey, subject, createdAt",
		});

		this.version(7).stores({
			wrongAnswers: "++id, subject, topic, reviewed, createdAt",
		});

		this.version(8).stores({
			questionRatings: "++id, questionId, subject, topic, rating, createdAt",
		});

		this.version(9).stores({
			chatMessages: "++id, role, timestamp",
		});

		this.version(10).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions",
		});

		this.version(11).stores({
			examSessions: "++id, &paperId, startedAt, lastSavedAt, completed",
			cachedPdfs: "++id, &paperId, cachedAt",
		});

		this.version(12).stores({
			examDates: "++id, &cacheKey, session, year, updatedAt",
		});

		this.version(13).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
		});

		this.version(14).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
			progress: "++id, &odSubjectId, userId, updatedAt",
			quizAttempts: "++id, &odSubject, userId, completedAt",
			subjects: "++id, &code, cachedAt",
			quizSessions: "++id, &sessionId, subject, startedAt, lastSavedAt",
			conflicts: "++id, resolvedAt",
			jobs: "++id, type, status, priority, scheduledAt, createdAt",
			competencies: "++id, subjectId, topicId, bloomLevel, level, lastAssessed",
			visuals: "++id, &cacheKey, subject, createdAt",
			wrongAnswers: "++id, subject, topic, reviewed, createdAt",
			questionRatings: "++id, questionId, subject, topic, rating, createdAt",
			examSessions: "++id, &paperId, startedAt, lastSavedAt, completed",
			cachedPdfs: "++id, &paperId, cachedAt",
			examDates: "++id, &cacheKey, session, year, updatedAt",
		});

		this.version(15).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
			progress: "++id, &odSubjectId, userId, updatedAt",
			quizAttempts: "++id, &odSubject, userId, completedAt",
			subjects: "++id, &code, cachedAt",
			quizSessions: "++id, &sessionId, subject, startedAt, lastSavedAt",
			conflicts: "++id, resolvedAt",
			jobs: "++id, type, status, priority, scheduledAt, createdAt",
			competencies: "++id, subjectId, topicId, bloomLevel, level, lastAssessed",
			visuals: "++id, &cacheKey, subject, createdAt",
			wrongAnswers: "++id, subject, topic, reviewed, createdAt",
			questionRatings: "++id, questionId, subject, topic, rating, createdAt",
			examSessions: "++id, &paperId, startedAt, lastSavedAt, completed",
			cachedPdfs: "++id, &paperId, cachedAt",
			examDates: "++id, &cacheKey, session, year, updatedAt",
		});

		this.version(16).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			notes: "++id, subject, topic, updatedAt",
		});

		this.version(17).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			notes: "++id, subject, topic, updatedAt",
			groupPosts: "++id, groupId, userId, createdAt",
		});

		this.version(18).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			notes: "++id, subject, topic, updatedAt",
			groupPosts: "++id, groupId, userId, createdAt",
			quizPacks: "&id, subject, topic, status, createdAt, expiresAt",
			packQuestions: "++id, &[packId+questionIndex], packId",
		});

		this.version(19).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			notes: "++id, subject, topic, updatedAt",
			groupPosts: "++id, groupId, userId, createdAt",
			groupComments: "++id, postId, parentId, userId, createdAt",
			groupReactions: "++id, postId, commentId, userId, emoji, createdAt",
			quizPacks: "&id, subject, topic, status, createdAt, expiresAt",
			packQuestions: "++id, &[packId+questionIndex], packId",
		});

		this.version(20).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			notes: "++id, subject, topic, updatedAt",
			groupPosts: "++id, groupId, userId, createdAt",
			groupComments: "++id, postId, parentId, userId, createdAt",
			groupReactions: "++id, postId, commentId, userId, emoji, createdAt",
			gamification: "++id, totalXp, currentStreak, lastPracticeDate",
			quizPacks: "&id, subject, topic, status, createdAt, expiresAt",
			packQuestions: "++id, &[packId+questionIndex], packId",
		});

		this.version(21).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
		});

		this.version(22).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
		});

		this.version(23).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
			groupChallenges: "&id, groupId, weekStart, status",
			groupChallengeEntries: "&id, challengeId, groupId, userId",
			groupBadges: "&id, groupId, userId, tier",
		});

		this.version(24).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
			groupChallenges: "&id, groupId, weekStart, status",
			groupChallengeEntries: "&id, challengeId, groupId, userId",
			groupBadges: "&id, groupId, userId, tier",
			userConsents: "&userId, updatedAt",
		});

		this.version(25).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
			groupChallenges: "&id, groupId, weekStart, status",
			groupChallengeEntries: "&id, challengeId, groupId, userId",
			groupBadges: "&id, groupId, userId, tier",
			userConsents: "&userId, updatedAt",
			tinyfishCache: "&key, expiresAt",
			tinyfishUsage: "++id, &[userId+date], userId, date",
		});

		// v26: added `webSources?: { url, title }[]` (plain JSON field) to the Question type
		// for per-question RAG source attribution. No new index needed — Dexie stores
		// the field transparently on existing `questions` / `quizSessions` rows.
		// Existing rows load with `webSources: undefined` and the UI hides the pill
		// when the field is missing (lazy rehydrate).
		this.version(26).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
			groupChallenges: "&id, groupId, weekStart, status",
			groupChallengeEntries: "&id, challengeId, groupId, userId",
			groupBadges: "&id, groupId, userId, tier",
			userConsents: "&userId, updatedAt",
			tinyfishCache: "&key, expiresAt",
			tinyfishUsage: "++id, &[userId+date], userId, date",
		});

		// v27: analyticsEvents + retentionRecurrence tables for WAM/retention tracking
		this.version(27).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
			groupChallenges: "&id, groupId, weekStart, status",
			groupChallengeEntries: "&id, challengeId, groupId, userId",
			groupBadges: "&id, groupId, userId, tier",
			userConsents: "&userId, updatedAt",
			tinyfishCache: "&key, expiresAt",
			tinyfishUsage: "++id, &[userId+date], userId, date",
			analyticsEvents: "++id, eventType, userId, timestamp",
			retentionRecurrence: "++id, questionId, userId, scheduledAt, completed",
		});

		this.version(28).stores({
			flashcards:
				"&id, subject, topic, nextReview, easeFactor, interval, repetitions, status, learningStep, leeched, updatedAt",
			reviewHistory: "++id, cardId, reviewedAt",
			extractionCache: "++id, &imageHash, createdAt",
			chatMessages: "++id, role, timestamp",
			questions: "++id, &subject, topic, cachedAt",
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
			pastPaperQuestions:
				"&id, subject, year, paperNumber, questionType, createdAt",
			groupChallenges: "&id, groupId, weekStart, status",
			groupChallengeEntries: "&id, challengeId, groupId, userId",
			groupBadges: "&id, groupId, userId, tier",
			userConsents: "&userId, updatedAt",
			tinyfishCache: "&key, expiresAt",
			tinyfishUsage: "++id, &[userId+date], userId, date",
			analyticsEvents: "++id, eventType, userId, timestamp",
			retentionRecurrence: "++id, questionId, userId, scheduledAt, completed",
			sharedQuestions: "&id, subject, topic, sharedById, sharedAt",
		});
	}
}

export const offlineDB = new LumniOfflineDB();
