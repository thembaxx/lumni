import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { safeJsonParse, safeJsonStringify } from "@/lib/utils/json";
import type { VisualContent } from "./types";

const COLLECTION_ID = COLLECTIONS.VISUALS;

function makeDocumentId(questionId: string, subject: string): string {
	const raw = `${questionId}-${subject}`;
	const sanitized = raw.replace(/[^a-zA-Z0-9._-]/g, "_");
	return sanitized.slice(0, 36);
}

export async function saveVisualToAppwrite(
	questionId: string,
	subject: string,
	visual: VisualContent | null,
): Promise<void> {
	try {
		await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTION_ID,
			makeDocumentId(questionId, subject),
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
			makeDocumentId(questionId, subject),
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
