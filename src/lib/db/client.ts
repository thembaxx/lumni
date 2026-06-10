import { APPWRITE_DATABASE_ID, COLLECTIONS } from "./constants";

export { APPWRITE_DATABASE_ID, COLLECTIONS };

import type { Databases } from "appwrite";
import { browserDatabases } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";
import type { AppwriteExamPaperRecord } from "@/types/exam";

let _serverDb: Databases | null = null;

async function getDb(): Promise<Databases> {
	if (typeof window !== "undefined") {
		return browserDatabases;
	}
	if (!_serverDb) {
		const { databases } = await import("@/lib/appwrite.server");
		_serverDb = databases as unknown as Databases;
	}
	return _serverDb;
}

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
	const db = await getDb();
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
		const db = await getDb();
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
	const db = await getDb();
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
	const db = await getDb();
	await db.updateDocument(APPWRITE_DATABASE_ID, collection, documentId, data);
}

export async function deleteDocument(
	collection: string,
	documentId: string,
): Promise<void> {
	if (!APPWRITE_DATABASE_ID) return;
	const db = await getDb();
	await db.deleteDocument(APPWRITE_DATABASE_ID, collection, documentId);
}
