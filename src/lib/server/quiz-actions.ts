"use server";

import { Query } from "appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export async function fetchQuestions(subjectIds: string[]) {
	if (subjectIds.length === 0) return [];

	const topicDocs = await listDocuments(COLLECTIONS.TOPICS);

	const typedTopicDocs = topicDocs as { $id: string; subjectId: string }[];

	const topicIds = typedTopicDocs
		.filter((t) => subjectIds.includes(t.subjectId))
		.map((t) => t.$id);

	if (topicIds.length === 0) return [];

	const questionsData = (await listDocuments(COLLECTIONS.QUESTIONS)) as {
		$id: string;
		topicId: string;
		options: string;
	}[];

	const filtered = questionsData.filter((q) => topicIds.includes(q.topicId));

	return filtered.map((q) => ({
		...q,
		options: q.options ? JSON.parse(q.options) : null,
	}));
}
