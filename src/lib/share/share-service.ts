import { Query } from "appwrite";
import { dexieDataAccess } from "@/lib/db";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
import type { ContentDataAccess } from "@/lib/db/data-access";
import type { SharedQuestionRecord } from "@/lib/db/schema";
import type { FlashcardDeck } from "@/lib/flashcard-engine/deck-types";
import type { Question } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import { syncManager } from "@/lib/sync/sync-manager";

const DEFAULT_DEPS = { db: dexieDataAccess };
let _deps: { db: ContentDataAccess } = DEFAULT_DEPS;

function __setDepsForTesting(deps: { db: ContentDataAccess }) {
	_deps = deps;
}

interface SharedRecord {
	id: string;
	question: Question;
	subject: string;
	topic: string;
	sharedById: string;
	sharedAt: number;
	viewCount: number;
	sources?: { url: string; title: string }[];
}

function generateShareId(): string {
	const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < 10; i++) {
		result += chars[Math.floor(Math.random() * chars.length)];
	}
	return result;
}

export async function shareQuestion(
	question: Question,
	subject: string,
	topic: string,
	userId: string,
	sources?: { url: string; title: string }[],
): Promise<string> {
	const id = generateShareId();
	const record: SharedRecord = {
		id,
		question,
		subject,
		topic,
		sharedById: userId,
		sharedAt: Date.now(),
		viewCount: 0,
		sources: sources?.length ? sources : undefined,
	};

	try {
		await _deps.db.sharedQuestions.add(
			record as unknown as SharedQuestionRecord,
		);
	} catch (err) {
		logError("ShareQuestionDexie", err);
	}

	syncManager.enqueue({
		type: "appwrite-shared-question-sync",
		payload: {
			id,
			question: JSON.stringify(question),
			subject,
			topic,
			sharedById: userId,
			sharedAt: Date.now(),
			sources:
				sources && sources.length > 0 ? JSON.stringify(sources) : undefined,
		},
	});

	return id;
}

export async function getSharedQuestion(
	id: string,
): Promise<SharedRecord | null> {
	try {
		const local = await _deps.db.sharedQuestions.get(id);
		if (local) {
			const record = local as unknown as SharedRecord;
			if (record.question) return record;
		}
	} catch (err) {
		logError("GetSharedQuestionLocal", err);
	}

	try {
		const docs = await listDocuments(COLLECTIONS.SHARED_QUESTIONS, [
			Query.equal("id", id),
		]);
		if (docs.length > 0) {
			const doc = docs[0] as Record<string, unknown>;
			const parsed: SharedRecord = {
				id: doc.id as string,
				question: JSON.parse(doc.question as string) as Question,
				subject: doc.subject as string,
				topic: doc.topic as string,
				sharedById: doc.sharedById as string,
				sharedAt: new Date(doc.sharedAt as string).getTime(),
				viewCount: (doc.viewCount as number) ?? 0,
				sources: doc.sources
					? typeof doc.sources === "string"
						? (JSON.parse(doc.sources as string) as {
								url: string;
								title: string;
							}[])
						: (doc.sources as { url: string; title: string }[])
					: undefined,
			};
			return parsed;
		}
	} catch (err) {
		logError("GetSharedQuestionAppwrite", err);
	}

	return null;
}

export async function incrementViewCount(id: string): Promise<void> {
	try {
		await _deps.db.sharedQuestions
			.where("id")
			.equals(id)
			.modify((rec: { viewCount?: number }) => {
				rec.viewCount = (rec.viewCount ?? 0) + 1;
			});
	} catch (err) {
		logError("IncrementViewCountDexie", err);
	}

	try {
		const docs = await listDocuments(COLLECTIONS.SHARED_QUESTIONS, [
			Query.equal("id", id),
		]);
		if (docs.length > 0) {
			const doc = docs[0] as Record<string, unknown>;
			await updateDocument(COLLECTIONS.SHARED_QUESTIONS, doc.$id as string, {
				viewCount: ((doc.viewCount as number) ?? 0) + 1,
			});
		}
	} catch (err) {
		logError("IncrementViewCountAppwrite", err);
	}
}

export async function shareAssignment(
	assignmentId: string,
	topic: string,
	questionCount: number,
	dueDate?: string,
): Promise<{ shareId: string; url: string }> {
	const shareId = crypto.randomUUID();
	const record: SharedRecord = {
		id: shareId,
		question: {
			type: "assignment",
			id: assignmentId,
			topic,
			questionCount,
			dueDate: dueDate || null,
			createdAt: Date.now(),
			expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
		} as unknown as Question,
		subject: topic,
		topic,
		sharedById: "teacher",
		sharedAt: Date.now(),
		viewCount: 0,
	};

	try {
		await _deps.db.sharedQuestions.add(
			record as unknown as SharedQuestionRecord,
		);
	} catch (err) {
		logError("ShareAssignmentDexie", err);
	}

	return {
		shareId,
		url: `/shared/assignment/${shareId}`,
	};
}

export async function shareFlashcardDeck(
	deck: Omit<FlashcardDeck, "id" | "createdAt">,
	userId: string,
): Promise<string> {
	const id = generateShareId();
	const record: SharedRecord = {
		id,
		question: {
			type: "flashcard-deck",
			deckData: deck,
		} as unknown as Question,
		subject: "general",
		topic: "flashcards",
		sharedById: userId,
		sharedAt: Date.now(),
		viewCount: 0,
	};

	try {
		await _deps.db.sharedQuestions.add(
			record as unknown as SharedQuestionRecord,
		);
	} catch (err) {
		logError("ShareFlashcardDeck", err);
	}

	return id;
}
