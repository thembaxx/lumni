import { CachedAIGenerator } from "@/lib/ai/cached-ai-generator";
import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { CachedStudyGuide, StudyGuide } from "./types";

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

const config = {
  systemPrompt: SYSTEM_PROMPT,
  ttlMs: STUDY_GUIDE_TTL,
  buildCacheKey: (subject: string, topic: string) =>
    `${subject.toLowerCase()}-${topic.toLowerCase()}`.replace(/\s+/g, "-"),
  buildPrompt: (subject: string, topic: string) =>
    `Subject: ${subject}\nTopic: ${topic}\n\nGenerate a comprehensive study guide covering the key concepts, definitions, and relationships for this topic.`,
  parseResponse: (content: string) => JSON.parse(content) as StudyGuide,
  emptyResult: { sections: [], summary: "" } as StudyGuide,
  isEmpty: (result: StudyGuide) => result.sections.length === 0,
  getTable: (db: DataAccess) => ({
    get: (key: string) => db.studyGuides.get(key),
    put: (entry: unknown) => db.studyGuides.put(entry as CachedStudyGuide),
  }),
  buildCacheEntry: (key: string, data: StudyGuide, ttlMs: number, subject: string, topic: string) =>
    ({
      key,
      guide: data,
      subject,
      topic,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    }) satisfies CachedStudyGuide,
  extractData: (cached: unknown) => (cached as CachedStudyGuide).guide,
  errorLabel: "StudyGuideService",
};

let _deps: { db: DataAccess } = Object.freeze({ db: dexieDataAccess });

function __setDepsForTesting(deps: { db: DataAccess }) {
  _deps = Object.freeze({ ...deps });
}

function createGenerator() {
  return new CachedAIGenerator(config, getAI(), _deps.db);
}

export async function generateGuide(subject: string, topic: string): Promise<StudyGuide> {
  return createGenerator().generate(subject, topic);
}

export async function getCachedGuide(subject: string, topic: string): Promise<StudyGuide | null> {
  return createGenerator().getCached(subject, topic);
}

export async function storeGuide(subject: string, topic: string, guide: StudyGuide): Promise<void> {
  return createGenerator().store(subject, topic, guide);
}
