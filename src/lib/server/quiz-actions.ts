"use server";

import { eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { question as questionTable, topic } from "@/lib/db/schema";

export async function fetchQuestions(subjectIds: string[]) {
	if (subjectIds.length === 0) return [];

	const db = getDb();

	const topicIds = await db
		.select({ id: topic.id })
		.from(topic)
		.where(inArray(topic.subjectId, subjectIds));

	if (topicIds.length === 0) return [];

	const questionsData = await db
		.select()
		.from(questionTable)
		.where(
			inArray(
				questionTable.topicId,
				topicIds.map((t) => t.id),
			),
		);

	return questionsData.map((q) => ({
		...q,
		options: q.options ? JSON.parse(q.options) : null,
	}));
}
