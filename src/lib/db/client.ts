import { databases } from "@/lib/appwrite";

export const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "lumni";

export const COLLECTIONS = {
	SUBJECTS: "subjects",
	TOPICS: "topics",
	QUESTIONS: "questions",
	USER_SUBJECTS: "user_subjects",
	USER_PROGRESS: "user_progress",
	STUDY_SESSIONS: "study_sessions",
	EXAM_PAPERS: "exam_papers",
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
	createdAt: string;
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

export type ExamPaper = {
	$id: string;
	subjectId: string;
	year: number;
	paperNumber: number;
	type: string;
	memoId?: string;
	fileUrl: string;
	fileKey: string;
	originalFileName?: string;
	uploadedAt: string;
};

export async function listDocuments<T>(
	collection: string,
	queries: string[] = [],
): Promise<T[]> {
	const response = await databases.listDocuments(
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
	try {
		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			collection,
			documentId,
		);
		return doc as unknown as T;
	} catch {
		return null;
	}
}

export async function createDocument(
	collection: string,
	data: Record<string, unknown>,
): Promise<string> {
	const doc = await databases.createDocument(
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
	await databases.updateDocument(
		APPWRITE_DATABASE_ID,
		collection,
		documentId,
		data,
	);
}

export async function deleteDocument(
	collection: string,
	documentId: string,
): Promise<void> {
	await databases.deleteDocument(APPWRITE_DATABASE_ID, collection, documentId);
}
