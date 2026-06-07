import { Query } from "appwrite";
import { dexieDataAccess } from "@/lib/db";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
import type { DataAccess } from "@/lib/db/data-access";
import type { SharedQuestionRecord as SchemaRecord } from "@/lib/db/schema";
import type { FlashcardDeck } from "@/lib/flashcard-engine/deck-types";
import type { Question } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import { syncManager } from "@/lib/sync/sync-manager";

const DEFAULT_DEPS = { db: dexieDataAccess };
let _deps = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

export interface SharedQuestionRecord extends Omit<SchemaRecord, "question"> {
	question: Question;
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
	const record: Record<string, unknown> = {
		id,
		question: JSON.parse(JSON.stringify(question)) as Record<string, unknown>,
		subject,
		topic,
		sharedById: userId,
		sharedAt: Date.now(),
		viewCount: 0,
	};
	if (sources && sources.length > 0) {
		record.sources = sources;
	}

	try {
		await _deps.db.sharedQuestions.add(record as never);
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
): Promise<SharedQuestionRecord | null> {
	try {
		const local = await _deps.db.sharedQuestions.get(id);
		if (local) {
			const record = local as unknown as SharedQuestionRecord;
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
			const parsed: SharedQuestionRecord = {
				id: doc.id as string,
				question: JSON.parse(doc.question as string) as Question,
				subject: doc.subject as string,
				topic: doc.topic as string,
				sharedById: doc.sharedById as string,
				sharedAt: new Date(doc.sharedAt as string).getTime(),
				viewCount: (doc.viewCount as number) ?? 0,
				sources: doc.sources
					? typeof doc.sources === "string"
						? JSON.parse(doc.sources as string)
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
			.modify((record: SchemaRecord) => {
				record.viewCount = (record.viewCount ?? 0) + 1;
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
	const shareData = {
		type: "assignment",
		assignmentId,
		topic,
		questionCount,
		dueDate: dueDate || null,
		createdAt: Date.now(),
		expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
	};
	localStorage.setItem(
		`lumni_shared_assignment_${shareId}`,
		JSON.stringify(shareData),
	);
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
	const record: Record<string, unknown> = {
		id,
		type: "flashcard-deck",
		deckData: deck,
		sharedById: userId,
		sharedAt: Date.now(),
		viewCount: 0,
	};

	try {
		await _deps.db.sharedQuestions.add(record as never);
	} catch (err) {
		logError("ShareFlashcardDeck", err);
	}

	return id;
}

export function getSharedAssignment(shareId: string): {
	type: string;
	assignmentId: string;
	topic: string;
	questionCount: number;
	dueDate: string | null;
} | null {
	try {
		const raw = localStorage.getItem(`lumni_shared_assignment_${shareId}`);
		if (!raw) return null;
		return JSON.parse(raw) as {
			type: string;
			assignmentId: string;
			topic: string;
			questionCount: number;
			dueDate: string | null;
		};
	} catch (err) {
		logError("GetSharedAssignment", err);
		return null;
	}
}
