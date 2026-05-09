"use server";

import { Query } from "appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export async function fetchQuestions(subjectIds: string[]) {
	if (subjectIds.length === 0) return [];

	const topicDocs = await listDocuments(COLLECTIONS.TOPICS);

	const topicIds = topicDocs
		.filter((t) => subjectIds.includes(t.subjectId as string))
		.map((t) => t.$id);

	if (topicIds.length === 0) return [];

	const questionsData = await listDocuments(COLLECTIONS.QUESTIONS);

	const filtered = questionsData.filter((q) =>
		topicIds.includes(q.topicId as string),
	);

	return filtered.map((q) => ({
		...q,
		options: q.options ? JSON.parse(q.options as string) : null,
	}));
}
