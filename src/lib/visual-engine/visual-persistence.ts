import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { makeCacheKey } from "@/lib/db/repositories/visual-cache";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";
import type { VisualContent } from "./types";

const COLLECTION_ID = COLLECTIONS.VISUALS;

export async function saveVisualToAppwrite(
	questionId: string,
	subject: string,
	visual: VisualContent | null,
): Promise<void> {
	try {
		await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTION_ID,
			makeCacheKey(questionId, subject),
			{
				questionId,
				subject,
				visual: safeJsonStringify(visual),
				createdAt: new Date().toISOString(),
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			},
		);
	} catch {
		/* Appwrite visual persistence is optional */
	}
}

export async function loadVisualFromAppwrite(
	questionId: string,
	subject: string,
): Promise<VisualContent | null> {
	try {
		const response = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTION_ID,
			makeCacheKey(questionId, subject),
		);

		if (!response) return null;

		const doc = response as Record<string, unknown>;
		const visual = safeJsonParse(
			doc.visual as string,
			null,
		) as VisualContent | null;
		const expiresAt = doc.expiresAt as string;

		if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
			return null;
		}

		return visual;
	} catch {
		return null;
	}
}
