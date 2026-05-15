import { Query } from "appwrite";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

const TTL_DAYS = 30;

export async function cleanupOldQuestions(): Promise<{
	deleted: number;
	remaining: number;
	error?: string;
}> {
	try {
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - TTL_DAYS);
		const cutoffIso = cutoff.toISOString();

		let deleted = 0;
		let remaining = 0;

		while (true) {
			const response = await databases.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.QUESTIONS,
				[Query.lessThan("createdAt", cutoffIso), Query.limit(100)],
			);

			if (response.documents.length === 0) break;

			remaining = response.total - response.documents.length;

			const deletePromises = response.documents.map((doc) =>
				databases
					.deleteDocument(APPWRITE_DATABASE_ID, COLLECTIONS.QUESTIONS, doc.$id)
					.catch((err: Error) =>
						console.error("[Cleanup] Delete error:", err.message),
					),
			);

			await Promise.allSettled(deletePromises);
			deleted += response.documents.length;
		}

		return { deleted, remaining: Math.max(0, remaining) };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown cleanup error";
		console.error("[Cleanup] Failed:", message);
		return { deleted: 0, remaining: 0, error: message };
	}
}
