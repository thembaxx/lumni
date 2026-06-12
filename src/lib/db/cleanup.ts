import { Query } from "appwrite";
import { databases } from "@/lib/server/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

const TTL_DAYS = 30;
const CLEANUP_PAGE_SIZE = 100;

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
		let hasMore = true;

		// Sequential pagination: each page depends on the previous batch being deleted (must run sequentially)
		while (hasMore) {
			const page = await cleanupPage(cutoffIso, deleted);
			deleted += page.deletedInPage;
			remaining = page.remaining;
			hasMore = page.hasMore;
		}

		return { deleted, remaining: Math.max(0, remaining) };
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Unknown cleanup error";
		console.error("[Cleanup] Failed:", message);
		return { deleted: 0, remaining: 0, error: message };
	}
}

interface CleanupPageResult {
	deletedInPage: number;
	remaining: number;
	hasMore: boolean;
}

async function cleanupPage(
	cutoffIso: string,
	alreadyDeleted: number,
): Promise<CleanupPageResult> {
	const response = await databases.listDocuments(
		APPWRITE_DATABASE_ID,
		COLLECTIONS.QUESTIONS,
		[Query.lessThan("createdAt", cutoffIso), Query.limit(CLEANUP_PAGE_SIZE)],
	);

	const docs = response.documents;
	if (docs.length === 0) {
		return { deletedInPage: 0, remaining: 0, hasMore: false };
	}

	const deletePromises = docs.map((doc: any) =>
		databases
			.deleteDocument(APPWRITE_DATABASE_ID, COLLECTIONS.QUESTIONS, doc.$id)
			.catch((err: Error) =>
				console.error(
					"[Cleanup] Delete error:",
					err instanceof Error ? err.message : "Unknown",
				),
			),
	);

	await Promise.allSettled(deletePromises);

	return {
		deletedInPage: docs.length,
		remaining: response.total - alreadyDeleted - docs.length,
		hasMore: docs.length === CLEANUP_PAGE_SIZE,
	};
}
