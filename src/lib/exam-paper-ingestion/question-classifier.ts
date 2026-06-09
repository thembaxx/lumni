import { curriculumRegistry } from "@/curriculum";
import { getAI } from "@/lib/ai/client";
import { logError } from "@/lib/shared/logger";
import type { PastPaperQuestion } from "./past-paper-question-types";

const BATCH_SIZE = 50;
const MAX_RETRIES = 2;

export interface ClassificationResult {
	id: string;
	subtopicId: string | null;
}

async function buildCurriculumContext(subjectId: string): Promise<string> {
	const curriculum = await curriculumRegistry.getSubject(subjectId);
	if (!curriculum) return "";
	return curriculum.topics
		.map(
			(t) =>
				`Topic: "${t.name}" (id: ${t.id})\n${t.subtopics.map((st) => `  - Subtopic: "${st.name}" (id: ${st.id})`).join("\n")}`,
		)
		.join("\n\n");
}

function buildBatchPrompt(
	subjectId: string,
	batch: PastPaperQuestion[],
	curriculumContext: string,
): string {
	const questionsJson = batch.map((q) => ({
		id: q.id,
		questionText: q.questionText.slice(0, 500),
		marks: q.marks,
		topic: q.topic || null,
	}));

	return `You are classifying past exam questions against the CAPS curriculum for "${subjectId}".

Curriculum structure (topic → subtopics):
${curriculumContext}

Questions to classify:
${JSON.stringify(questionsJson, null, 2)}

For each question, assign the subtopicId that best matches. If no good match exists, return null.
Return ONLY valid JSON array: [{"id": "<questionId>", "subtopicId": "<subtopicId>" | null}, ...]`;
}

function parseClassificationResponse(raw: string): ClassificationResult[] {
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.filter(
			(r): r is ClassificationResult =>
				typeof r === "object" &&
				r !== null &&
				typeof r.id === "string" &&
				(r.subtopicId === null || typeof r.subtopicId === "string"),
		);
	} catch {
		return [];
	}
}

export async function classifyQuestions(
	questions: PastPaperQuestion[],
	subjectId: string,
): Promise<ClassificationResult[]> {
	if (questions.length === 0) return [];

	const curriculumContext = await buildCurriculumContext(subjectId);
	if (!curriculumContext) {
		logError(
			"QuestionClassifier",
			new Error(`No curriculum found for ${subjectId}`),
		);
		return [];
	}

	const results: ClassificationResult[] = [];
	const ai = getAI();

	for (let i = 0; i < questions.length; i += BATCH_SIZE) {
		const batch = questions.slice(i, i + BATCH_SIZE);
		const prompt = buildBatchPrompt(subjectId, batch, curriculumContext);
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			try {
				const response = await ai.generateWithSystem(
					"You are a CAPS curriculum expert. Classify questions accurately. Return ONLY valid JSON.",
					prompt,
				);
				if (!("content" in response) || !response.content) {
					throw new Error("Empty response");
				}
				const batchResults = parseClassificationResponse(response.content);
				if (batchResults.length === 0) {
					throw new Error("Failed to parse classification results");
				}
				results.push(...batchResults);
				break;
			} catch (err) {
				lastError = err instanceof Error ? err : new Error(String(err));
				if (attempt < MAX_RETRIES) continue;
				logError("QuestionClassifier", lastError, {
					batch: i / BATCH_SIZE,
					subjectId,
				});
				results.push(...batch.map((q) => ({ id: q.id, subtopicId: null })));
			}
		}
	}

	return results;
}
