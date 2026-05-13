import { Query } from "appwrite";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";

interface CompetencySyncPayload {
	type: "competency";
	subjectId: string;
	topicId: string;
	bloomLevel: string;
	score: number;
	attempts: number;
	lastAssessed: number;
	level: string;
}

export async function handleCompetencySync(
	action: string,
	payload: unknown,
): Promise<void> {
	if (action !== "sync") return;

	const data = payload as CompetencySyncPayload;
	if (data.type !== "competency") return;

	const existing = await listDocuments<Record<string, unknown>>(
		COLLECTIONS.COMPETENCIES,
		[
			Query.equal("subjectId", data.subjectId),
			Query.equal("topicId", data.topicId),
			Query.equal("bloomLevel", data.bloomLevel),
		],
	);

	const now = new Date().toISOString();

	if (existing.length > 0) {
		await updateDocument(COLLECTIONS.COMPETENCIES, existing[0].$id as string, {
			score: data.score,
			attempts: data.attempts,
			level: data.level,
			lastAssessed: data.lastAssessed,
			updatedAt: now,
		});
	} else {
		await createDocument(COLLECTIONS.COMPETENCIES, {
			subjectId: data.subjectId,
			topicId: data.topicId,
			bloomLevel: data.bloomLevel,
			score: data.score,
			attempts: data.attempts,
			level: data.level,
			lastAssessed: data.lastAssessed,
			createdAt: now,
			updatedAt: now,
		});
	}
}
