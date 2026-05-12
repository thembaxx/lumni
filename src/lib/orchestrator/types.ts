export type JobType =
	| "visual-pre-cache"
	| "appwrite-sync"
	| "analytics-sync"
	| "spaced-rep-update"
	| "progress-update"
	| "competency-update";

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
