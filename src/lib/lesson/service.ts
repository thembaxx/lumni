import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { LessonDataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import type { CachedLesson, Lesson } from "./types";

const DEFAULT_DEPS = { db: dexieDataAccess as LessonDataAccess };
let _deps: { db: LessonDataAccess } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: LessonDataAccess }) {
	_deps = deps;
}

const LESSON_TTL = 30 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a lesson generator for students following the South African CAPS curriculum. Given a subject and subtopic, produce a structured lesson covering the key concepts. Format your response as JSON with this schema:
{
  "sections": [
    {
      "id": "section-1",
      "title": "Section Title",
      "content": "Detailed explanatory content for this section. Use plain text. Include definitions, explanations, and connections between ideas.",
      "type": "concept|example|activity|summary",
      "keyPoints": ["Key point 1", "Key point 2"]
    }
  ],
  "summary": "A brief overall summary of the lesson (2-3 sentences)",
  "estimatedMinutes": 20,
  "vocabulary": [
    { "term": "Key term", "definition": "Simple definition" }
  ]
}
Generate 3-6 sections covering: foundational concepts, core theory, practical applications, worked examples, common misconceptions. Keep content grade-appropriate, aligned with CAPS, and factual. Return ONLY valid JSON.`;

export async function generateLesson(
	subject: string,
	topic: string,
	subtopic: string,
): Promise<Lesson> {
	const ai = getAI();
	const prompt = `Subject: ${subject}\nTopic: ${topic}\nSubtopic: ${subtopic}\n\nGenerate a structured lesson for this CAPS curriculum subtopic. Include key concepts, definitions, worked examples, and vocabulary.`;
	const result = await ai.generateWithSystem(SYSTEM_PROMPT, prompt);
	if (!("content" in result) || !result.content) {
		return { sections: [], summary: "", estimatedMinutes: 0 };
	}
	try {
		const parsed = JSON.parse(result.content) as Lesson;
		return parsed;
	} catch (err) {
		logError("LessonService", err);
		return { sections: [], summary: "", estimatedMinutes: 0 };
	}
}

export async function getCachedLesson(
	subject: string,
	topic: string,
	subtopic: string,
): Promise<Lesson | null> {
	try {
		const key =
			`${subject.toLowerCase()}-${topic.toLowerCase()}-${subtopic.toLowerCase()}`.replace(
				/\s+/g,
				"-",
			);
		const cached = await _deps.db.lessonCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.lesson;
		}
	} catch {
		// IndexedDB unavailable (server-side)
	}
	return null;
}

export async function storeLesson(
	subject: string,
	topic: string,
	subtopic: string,
	lesson: Lesson,
): Promise<void> {
	try {
		const key =
			`${subject.toLowerCase()}-${topic.toLowerCase()}-${subtopic.toLowerCase()}`.replace(
				/\s+/g,
				"-",
			);
		const entry: CachedLesson = {
			key,
			lesson,
			subject,
			topic,
			subtopic,
			createdAt: Date.now(),
			expiresAt: Date.now() + LESSON_TTL,
		};
		await _deps.db.lessonCache.put(entry);
	} catch {
		// IndexedDB unavailable (server-side)
	}
}
