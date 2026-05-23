import type { Question } from "@/lib/question-engine/types";

export type JobType =
	| "appwrite-sync"
	| "analytics-sync"
	| "spaced-rep-update"
	| "progress-update"
	| "competency-update"
	| "visual-generation"
	| "appwrite-progress-sync"
	| "appwrite-attempt-sync"
	| "appwrite-competency-sync"
	| "appwrite-flashcard-sync"
	| "appwrite-wrong-answer-sync"
	| "appwrite-chat-sync"
	| "appwrite-rating-sync"
	| "appwrite-study-plan-sync"
	| "appwrite-question-flag"
	| "question-regen";

export type JobPayloadByType = {
	"appwrite-sync": { questions: Question[]; subject: string; topic?: string };
	"analytics-sync": { events: unknown[] };
	"spaced-rep-update": {
		question: Question;
		result: { correct: boolean; score: number };
	};
	"progress-update": {
		subject: string;
		result: { correct: boolean; score: number };
	};
	"competency-update": {
		subject: string;
		topic: string;
		bloomLevel: string;
		score: number;
	};
	"visual-generation": {
		questionId: string;
		questionText: string;
		subject: string;
		topic?: string;
	};
	"appwrite-progress-sync": {
		odSubjectId: string;
		userId: string;
		questionsAttempted: number;
		correctCount: number;
		currentStreak: number;
		longestStreak: number;
	};
	"appwrite-attempt-sync": {
		userId: string;
		subjectId: string;
		score: number;
		totalQuestions: number;
		duration: number;
		completedAt: number;
	};
	"appwrite-competency-sync": {
		userId?: string;
		subjectId: string;
		topicId: string;
		bloomLevel: string;
		proficiency: number;
		attempts: number;
		level: string;
		lastAssessed: number;
	};
	"appwrite-flashcard-sync": {
		userId?: string;
		id: string;
		front: string;
		back: string;
		subject: string;
		topic?: string;
		easeFactor: number;
		interval: number;
		repetitions: number;
		nextReview: number;
		lastReview: number | null;
		createdAt: number;
	};
	"appwrite-wrong-answer-sync": {
		userId?: string;
		questionId: string;
		questionText: string;
		subject: string;
		topic: string;
		correctAnswer: string;
		userAnswer: string;
		explanation: string;
		createdAt: number;
		reviewed: boolean;
		errorType?: string;
	};
	"appwrite-chat-sync": {
		userId?: string;
		messageId: string;
		role: string;
		content: string;
		type?: string;
		timestamp: number;
	};
	"appwrite-rating-sync": {
		questionId: string;
		subject: string;
		rating: number;
		feedback?: string;
		createdAt: number;
	};
	"appwrite-study-plan-sync": {
		userId: string;
		sessions: unknown[];
		examDates: unknown[];
		generatedAt: number;
	};
	"appwrite-question-flag": {
		questionId: string;
		userId: string;
		reason: string;
		details?: string;
		createdAt: number;
	};
	"question-regen": { questionId: string; subject: string };
};

export type JobStatus =
	| "pending"
	| "processing"
	| "completed"
	| "failed"
	| "cancelled";

export interface JobRecord {
	id?: number;
	type: JobType;
	payload: string;
	status: JobStatus;
	priority: number;
	attempts: number;
	maxRetries: number;
	lastError?: string;
	scheduledAt: number;
	createdAt: number;
	startedAt?: number;
	completedAt?: number;
	resultSummary?: string;
}

export interface EnqueueOptions {
	priority?: number;
	scheduledAt?: number;
}

export interface JobStats {
	pending: number;
	processing: number;
	failed: number;
	completed: number;
}

export interface JobStatusResult {
	status: JobStatus;
	lastError?: string;
}

export interface GenerateResult {
	questions: import("@/lib/question-engine/types").Question[];
	count: number;
	type: string;
	jobIds: number[];
}

export interface GradeResult {
	result: import("@/lib/question-engine/types").GradingResult;
	jobIds: number[];
}
