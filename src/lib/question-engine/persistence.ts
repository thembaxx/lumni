import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { safeJsonParse, safeJsonStringify } from "@/lib/utils/json";
import type { Question } from "./types";

const COLLECTION_ID = COLLECTIONS.QUESTIONS;

export async function saveQuestionsToAppwrite(
	questions: Question[],
	subject: string,
	topic?: string,
): Promise<void> {
	try {
		const batchSize = 25;
		for (let i = 0; i < questions.length; i += batchSize) {
			const batch = questions.slice(i, i + batchSize);
			const promises = batch.map((q) =>
				databases
					.createDocument(APPWRITE_DATABASE_ID, COLLECTION_ID, "unique()", {
						topicId: topic || subject,
						type: q.type,
						questionText: q.questionText,
						options: safeJsonStringify(
							"options" in q.body ? q.body.options : [],
						),
						correctAnswer:
							"correctOptionId" in q.body
								? q.body.correctOptionId
								: q.explanation,
						explanation: q.explanation,
						difficulty: q.difficulty,
						bloomTaxonomy: q.bloomTaxonomy,
						points: q.points,
						hint: q.hint,
						steps: safeJsonStringify(q.steps || []),
						fullData: safeJsonStringify(q),
						createdAt: new Date().toISOString(),
					})
					.catch((err: Error) =>
						console.error("[Persistence] Save error:", err.message),
					),
			);
			await Promise.allSettled(promises);
		}
	} catch (error) {
		console.error("[Persistence] Failed to save to Appwrite:", error);
	}
}

export async function loadQuestionsFromAppwrite(
	subject: string,
	topic?: string,
	limit = 50,
): Promise<Question[]> {
	try {
		const { Query } = await import("appwrite");
		const queries = [
			Query.equal("topicId", topic || subject),
			Query.limit(limit),
		];
		const response = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTION_ID,
			queries,
		);
		return response.documents
			.map((doc: Record<string, unknown>) => {
				const fullData = doc.fullData as string | undefined;
				if (fullData) {
					return safeJsonParse(fullData, null) as Question | null;
				}
				return null;
			})
			.filter((q: Question | null): q is Question => q !== null);
	} catch (error) {
		console.error("[Persistence] Failed to load from Appwrite:", error);
		return [];
	}
}

export async function syncQuestionsToAppwrite(
	questions: Question[],
	subject: string,
	topic?: string,
): Promise<{ saved: number; existing: number }> {
	try {
		const existing = await loadQuestionsFromAppwrite(subject, topic, 200);
		const existingTexts = new Set(
			existing.map((q) => q.questionText.trim().toLowerCase()),
		);

		const newQuestions = questions.filter(
			(q) => !existingTexts.has(q.questionText.trim().toLowerCase()),
		);

		if (newQuestions.length > 0) {
			await saveQuestionsToAppwrite(newQuestions, subject, topic);
		}

		return { saved: newQuestions.length, existing: existing.length };
	} catch (error) {
		console.error("[Persistence] Sync error:", error);
		return { saved: 0, existing: 0 };
	}
}
