import { Query } from "appwrite";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import type { SharedQuestionRecord as SchemaRecord } from "@/lib/db/schema";
import { offlineDB } from "@/lib/db/schema";
import type { Question } from "@/lib/question-engine/types";

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
): Promise<string> {
	const id = generateShareId();
	const record = {
		id,
		question: JSON.parse(JSON.stringify(question)) as Record<string, unknown>,
		subject,
		topic,
		sharedById: userId,
		sharedAt: Date.now(),
		viewCount: 0,
	};

	try {
		await offlineDB.sharedQuestions.add(record as never);
	} catch {
		/* Dexie may not be ready */
	}

	createDocument(COLLECTIONS.SHARED_QUESTIONS, {
		id,
		question: JSON.stringify(question),
		subject,
		topic,
		sharedById: userId,
		sharedAt: new Date().toISOString(),
		viewCount: 0,
	}).catch(() => {
		/* Appwrite may be unavailable */
	});

	return id;
}

export async function getSharedQuestion(
	id: string,
): Promise<SharedQuestionRecord | null> {
	try {
		const local = await offlineDB.sharedQuestions.get(id);
		if (local) {
			const record = local as unknown as SharedQuestionRecord;
			if (record.question) return record;
		}
	} catch {
		/* fall through */
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
			};
			return parsed;
		}
	} catch {
		/* silent */
	}

	return null;
}

export async function incrementViewCount(id: string): Promise<void> {
	try {
		await offlineDB.sharedQuestions
			.where("id")
			.equals(id)
			.modify((record: SchemaRecord) => {
				record.viewCount = (record.viewCount ?? 0) + 1;
			});
	} catch {
		/* silent */
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
	} catch {
		/* silent */
	}
}
