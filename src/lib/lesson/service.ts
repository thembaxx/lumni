import { CachedAIGenerator } from "@/lib/ai/cached-ai-generator";
import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { Lesson } from "./types";

const LESSON_TTL = 30 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a lesson generator for South African Matric students. Given a subject and subtopic, produce a structured lesson with these section types:

- introduction: Set the context and learning objectives
- concept: Explain the core concept with definitions and theory
- worked-example: A step-by-step worked example
- comprehension-check: A short quiz or reflection question
- summary: Recap the key takeaways
- practice: Practice exercises for the student

Each section must have a title, content (markdown), and keyPoints array.
Also include relevant vocabulary words with definitions, part of speech, pronunciation, and language.

Format your response as JSON with this schema:
{
  "id": "unique-id",
  "subjectId": "subject-id",
  "topicId": "topic-id",
  "subtopicId": "subtopic-id",
  "title": "Lesson Title",
  "order": 1,
  "prerequisites": ["prerequisite topic"],
  "sections": [
    {
      "id": "section-1",
      "type": "introduction|concept|worked-example|comprehension-check|summary|practice",
      "title": "Section Title",
      "content": "Detailed content for this section. Use markdown formatting.",
      "keyPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "vocabulary": [
    {
      "word": "term",
      "definition": "meaning",
      "partOfSpeech": "noun|verb|adjective",
      "pronunciation": "/pronunciation/",
      "language": "en|af|zu"
    }
  ],
  "difficulty": "easy|medium|hard",
  "estimatedMinutes": 15
}

Generate 5-8 sections covering introduction, core concepts, worked examples, comprehension checks, summary, and practice. Keep content grade-appropriate for South African Matric students. Return ONLY valid JSON.`;

const config = {
	systemPrompt: SYSTEM_PROMPT,
	ttlMs: LESSON_TTL,
	buildCacheKey: (subjectId: string, subtopicId: string) =>
		`${subjectId.toLowerCase()}:${subtopicId.toLowerCase()}`.replace(
			/^-+|-+$/g,
			"",
		),
	buildPrompt: (subjectId: string, subtopicId: string) =>
		`Subject: ${subjectId}\nSubtopic: ${subtopicId}\n\nGenerate a comprehensive lesson for this subtopic. Include sections for introduction, concept explanation, worked examples, comprehension checks, summary, and practice exercises.`,
	parseResponse: (content: string) => JSON.parse(content) as Lesson,
	emptyResult: {
		id: "",
		subjectId: "",
		topicId: "",
		subtopicId: "",
		title: "",
		order: 0,
		prerequisites: [],
		sections: [],
		vocabulary: [],
		difficulty: "medium" as const,
		estimatedMinutes: 0,
	} satisfies Lesson,
	isEmpty: (result: Lesson) => result.sections.length === 0,
	getTable: (db: DataAccess) => ({
		get: (key: string) => db.studyGuides.get(key),
		put: (entry: unknown) =>
			db.studyGuides.put(
				entry as import("@/lib/study-guide/types").CachedStudyGuide,
			),
	}),
	buildCacheEntry: (key: string, data: Lesson, ttlMs: number) =>
		({
			key,
			guide: data,
			subject: data.subjectId,
			topic: data.subtopicId,
			createdAt: Date.now(),
			expiresAt: Date.now() + ttlMs,
		}) as unknown as import("@/lib/study-guide/types").CachedStudyGuide,
	extractData: (cached: unknown) => (cached as { guide: Lesson }).guide,
	errorLabel: "LessonService",
};

let _deps: { db: DataAccess } = { db: dexieDataAccess };

function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

function createGenerator() {
	return new CachedAIGenerator(config, getAI(), _deps.db);
}

export async function generateLesson(
	subjectId: string,
	_topicId: string,
	subtopicId: string,
): Promise<Lesson> {
	return createGenerator().generate(subjectId, subtopicId);
}

export async function getCachedLesson(
	subjectId: string,
	_topicId: string,
	subtopicId: string,
): Promise<Lesson | null> {
	return createGenerator().getCached(subjectId, subtopicId);
}

export async function storeLesson(
	subjectId: string,
	_topicId: string,
	subtopicId: string,
	lesson: Lesson,
): Promise<void> {
	return createGenerator().store(subjectId, subtopicId, lesson);
}
