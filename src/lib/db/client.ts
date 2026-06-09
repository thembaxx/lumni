import type { Databases } from "appwrite";
import { browserDatabases, databases } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";
import type { AppwriteExamPaperRecord } from "@/types/exam";

export const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID ?? "";

function getDb(): Databases {
	if (typeof window !== "undefined") {
		return browserDatabases;
	}
	return databases as unknown as Databases;
}

export const COLLECTIONS = {
	SUBJECTS: "subjects",
	TOPICS: "topics",
	QUESTIONS: "questions",
	USER_SUBJECTS: "user_subjects",
	USER_PROGRESS: "user_progress",
	STUDY_SESSIONS: "study_sessions",
	EXAM_PAPERS: "exam_papers",
	VISUALS: "visuals",
	COMPETENCIES: "competencies",
	EXAM_SESSIONS: "exam_sessions",
	REFERRAL_CODES: "referral_codes",
	REFERRALS: "referrals",
	STUDY_PLANS: "study_plans",
	QUESTION_FLAGS: "question_flags",
	ANALYTICS: "analytics",
	FLASHCARDS: "flashcards",
	WRONG_ANSWERS: "wrong_answers",
	CHAT_MESSAGES: "chat_messages",
	EXAM_DATES: "exam_dates",
	TEACHER_STUDENTS: "teacher_students",
	TEACHER_ASSIGNMENTS: "teacher_assignments",
	PARENT_STUDENTS: "parent_students",
	FLASHCARD_REVIEWS: "flashcard_reviews",
	STUDY_GROUPS: "study_groups",
	GROUP_MEMBERS: "group_members",
	GROUP_INVITES: "group_invites",
	BOOKMARKS: "bookmarks",
	NOTES: "notes",
	GROUP_POSTS: "group_posts",
	USER_GAMIFICATION: "user_gamification",
	GROUP_COMMENTS: "group_comments",
	GROUP_REACTIONS: "group_reactions",
	PAST_PAPER_QUESTIONS: "past_paper_questions",
	GROUP_CHALLENGES: "group_challenges",
	GROUP_CHALLENGE_ENTRIES: "group_challenge_entries",
	GROUP_BADGES: "group_badges",
	USER_CONSENTS: "user_consents",
	ASSIGNMENT_SUBMISSIONS: "assignment_submissions",
	SHARED_QUESTIONS: "shared_questions",
	TEACHER_OBSERVATIONS: "teacher_observations",
	ASSIGNMENT_MESSAGES: "assignment_messages",
	GHOST_LINKS: "ghost_links",
	LIVE_SESSIONS: "live_sessions",
	LIVE_SESSION_PARTICIPANTS: "live_session_participants",
} as const;

export type Subject = {
	$id: string;
	name: string;
	code: string;
	description?: string;
	icon?: string;
	category: string;
	color?: string;
	sourceUrl?: string;
	sourceVersion?: string;
	createdAt?: string;
};

export type Topic = {
	$id: string;
	subjectId: string;
	name: string;
	description?: string;
	unitNumber?: number;
	orderIndex?: number;
	createdAt: string;
};

export type Question = {
	$id: string;
	topicId: string;
	type: string;
	questionText: string;
	options?: string;
	correctAnswer: string;
	explanation?: string;
	difficulty?: string;
	hasImage?: boolean;
	imageUrl?: string;
	imageData?: string;
	orderIndex?: number;
	createdAt: string;
};

export type UserSubject = {
	$id: string;
	userId: string;
	subjectId: string;
	selectedAt: string;
};

export type UserProgress = {
	$id: string;
	userId: string;
	subjectId: string;
	questionsAttempted: number;
	correctCount: number;
	currentStreak: number;
	longestStreak: number;
	lastAttemptAt?: string;
	createdAt: string;
	updatedAt: string;
};

export type StudySession = {
	$id: string;
	userId: string;
	subjectId: string;
	questionsAnswered: number;
	correctCount: number;
	duration?: number;
	startedAt: string;
	endedAt?: string;
};

// Re-exported from types/exam.ts (single source of truth).
export type ExamPaperRecord = AppwriteExamPaperRecord;

export async function listDocuments<T>(
	collection: string,
	queries: string[] = [],
): Promise<T[]> {
	if (!APPWRITE_DATABASE_ID) {
		console.warn("[listDocuments] APPWRITE_DATABASE_ID is not set");
		return [];
	}
	const db = getDb();
	const response = await db.listDocuments(
		APPWRITE_DATABASE_ID,
		collection,
		queries,
	);
	return response.documents as unknown as T[];
}

export async function getDocument<T>(
	collection: string,
	documentId: string,
): Promise<T | null> {
	if (!APPWRITE_DATABASE_ID) return null;
	try {
		const db = getDb();
		const doc = await db.getDocument(
			APPWRITE_DATABASE_ID,
			collection,
			documentId,
		);
		return doc as unknown as T;
	} catch (err) {
		logError("DbClient", err);
		return null;
	}
}

export async function createDocument(
	collection: string,
	data: Record<string, unknown>,
): Promise<string> {
	if (!APPWRITE_DATABASE_ID) {
		throw new Error("APPWRITE_DATABASE_ID is missing");
	}
	const db = getDb();
	const doc = await db.createDocument(
		APPWRITE_DATABASE_ID,
		collection,
		"unique()",
		data,
	);
	return doc.$id;
}

export async function updateDocument(
	collection: string,
	documentId: string,
	data: Record<string, unknown>,
): Promise<void> {
	if (!APPWRITE_DATABASE_ID) return;
	const db = getDb();
	await db.updateDocument(APPWRITE_DATABASE_ID, collection, documentId, data);
}

export async function deleteDocument(
	collection: string,
	documentId: string,
): Promise<void> {
	if (!APPWRITE_DATABASE_ID) return;
	const db = getDb();
	await db.deleteDocument(APPWRITE_DATABASE_ID, collection, documentId);
}
