import { dexieDataAccess } from "@/lib/db";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";

export async function cacheQuestions(
	subject: string,
	questions: unknown[],
	topic?: string,
): Promise<number> {
	const key = topic ? `${subject}-${topic}` : subject;
	const existing = await dexieDataAccess.questions
		.where("subject")
		.equals(key)
		.first();

	if (existing) {
		return dexieDataAccess.questions.update(existing.id ?? 0, {
			questions: safeJsonStringify(questions),
			cachedAt: Date.now(),
		});
	}

	return dexieDataAccess.questions.add({
		subject: key,
		topic,
		questions: safeJsonStringify(questions),
		cachedAt: Date.now(),
	});
}

export async function getCachedQuestions(
	subject: string,
	topic?: string,
): Promise<unknown[] | undefined> {
	const key = topic ? `${subject}-${topic}` : subject;
	const cached = await dexieDataAccess.questions
		.where("subject")
		.equals(key)
		.first();

	if (!cached) return undefined;

	if (Date.now() - cached.cachedAt > 24 * 60 * 60 * 1000) {
		return undefined;
	}

	return safeJsonParse(cached.questions, []) as unknown[];
}
