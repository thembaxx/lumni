import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { StudyDataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import type { CachedStudyGuide, StudyGuide } from "./types";

const DEFAULT_DEPS = { db: dexieDataAccess };
let _deps: { db: StudyDataAccess } = DEFAULT_DEPS;

function __setDepsForTesting(deps: { db: StudyDataAccess }) {
	_deps = deps;
}

const STUDY_GUIDE_TTL = 30 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a study guide generator for students. Given a subject and topic, produce a structured study guide covering the key concepts. Format your response as JSON with this schema:
{
  "sections": [
    {
      "title": "Section Title",
      "content": "Detailed explanatory content for this section. Use plain text with minimal formatting. Include definitions, explanations, and connections between ideas.",
      "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
    }
  ],
  "summary": "A brief overall summary of the topic (2-3 sentences)"
}
Generate 3-6 sections covering: foundational concepts, core theory, practical applications, common misconceptions, and exam tips if relevant. Keep content grade-appropriate and factual. Return ONLY valid JSON.`;

export async function generateGuide(
	subject: string,
	topic: string,
): Promise<StudyGuide> {
	const ai = getAI();
	const prompt = `Subject: ${subject}\nTopic: ${topic}\n\nGenerate a comprehensive study guide covering the key concepts, definitions, and relationships for this topic.`;
	const result = await ai.generateWithSystem(SYSTEM_PROMPT, prompt);
	if (!("content" in result) || !result.content) {
		return { sections: [], summary: "" };
	}
	try {
		const parsed = JSON.parse(result.content) as StudyGuide;
		return parsed;
	} catch (err) {
		logError("StudyGuideService", err);
		return { sections: [], summary: "" };
	}
}

export async function getCachedGuide(
	subject: string,
	topic: string,
): Promise<StudyGuide | null> {
	try {
		const key = `${subject.toLowerCase()}-${topic.toLowerCase()}`.replace(
			/\s+/g,
			"-",
		);
		const cached = await _deps.db.studyGuides.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.guide;
		}
	} catch {
		// IndexedDB unavailable (server-side)
	}
	return null;
}

export async function storeGuide(
	subject: string,
	topic: string,
	guide: StudyGuide,
): Promise<void> {
	try {
		const key = `${subject.toLowerCase()}-${topic.toLowerCase()}`.replace(
			/\s+/g,
			"-",
		);
		const entry: CachedStudyGuide = {
			key,
			guide,
			subject,
			topic,
			createdAt: Date.now(),
			expiresAt: Date.now() + STUDY_GUIDE_TTL,
		};
		await _deps.db.studyGuides.put(entry);
	} catch {
		// IndexedDB unavailable (server-side)
	}
}
