"use server";

import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";

export async function fetchQuestions(subjectIds: string[]) {
	if (subjectIds.length === 0) return [];
	const _userId = await auth();

	const subjectSet = new Set(subjectIds);

	const [topicDocs, questionsData] = await Promise.all([
		listDocuments(COLLECTIONS.TOPICS),
		listDocuments(COLLECTIONS.QUESTIONS) as Promise<
			{
				$id: string;
				topicId: string;
				options: string;
			}[]
		>,
	]);

	const typedTopicDocs = topicDocs as { $id: string; subjectId: string }[];

	const topicIds = new Set<string>();
	for (const t of typedTopicDocs) {
		if (subjectSet.has(t.subjectId)) topicIds.add(t.$id);
	}

	if (topicIds.size === 0) return [];

	const result: { $id: string; topicId: string; options: unknown }[] = [];
	for (const q of questionsData) {
		if (topicIds.has(q.topicId)) {
			result.push({
				...q,
				options: q.options ? JSON.parse(q.options) : null,
			});
		}
	}
	return result;
}
