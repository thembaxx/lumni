"use server";

import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";

export async function fetchQuestions(subjectIds: string[]) {
	if (subjectIds.length === 0) return [];
	const _userId = await auth();

	const topicDocs = await listDocuments(COLLECTIONS.TOPICS);

	const typedTopicDocs = topicDocs as { $id: string; subjectId: string }[];

	const topicIds = typedTopicDocs.reduce((acc, t) => {
		if (subjectIds.includes(t.subjectId)) acc.push(t.$id);
		return acc;
	}, [] as string[]);

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
