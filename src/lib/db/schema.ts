import Dexie, { type Table } from "dexie";
import type { WrongAnswerEntry } from "@/hooks/use-wrong-answer-journal";
import type { CompetencyRecord } from "@/lib/competency-engine/types";
import type {
	FlashcardReview,
	FlashcardSM2,
} from "@/lib/flashcard-engine/types";
import type { JobRecord } from "@/lib/orchestrator/types";
import type { GroupPost } from "@/lib/study-groups/types";

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
	content: string;
	subject?: string;
	topic?: string;
	createdAt: number;
	updatedAt: number;
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
	}
}

export const offlineDB = new LumniOfflineDB();
