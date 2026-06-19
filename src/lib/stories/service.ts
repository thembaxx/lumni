import { CachedAIGenerator } from "@/lib/ai/cached-ai-generator";
import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { Story, StoryQuestion, StoryQuestionSet } from "./types";

// Dexie v33 adds storyCache + storyQuestions tables.

const QUESTIONS_TTL = 30 * 24 * 60 * 60 * 1000;

const QUESTIONS_SYSTEM_PROMPT = `You are a reading comprehension question generator. Given a short story, produce 3-5 comprehension questions that test literal recall, inferential understanding, and critical analysis. Mix question types between multiple-choice and short-answer. Format your response as a JSON array of objects with this schema:
[
  {
    "id": "q1",
    "storyId": "the-story-id",
    "questionText": "The question text",
    "questionType": "mcq",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Why this answer is correct",
    "bloomLevel": "remember"
  }
]
For short-answer questions, omit the options field and set correctAnswer to a brief expected response. Use Bloom's taxonomy levels: remember, understand, apply, analyze, evaluate, create. Return ONLY valid JSON.`;

const questionsConfig = {
	systemPrompt: QUESTIONS_SYSTEM_PROMPT,
	ttlMs: QUESTIONS_TTL,
	buildPrompt: (_subject: string, storyText: string) =>
		`Story:\n\n${storyText}\n\nGenerate 3-5 comprehension questions covering literal recall, inference, and critical analysis. Mix mcq and short-answer types.`,
	parseResponse: (content: string) => JSON.parse(content) as StoryQuestion[],
	emptyResult: [] as StoryQuestion[],
	isEmpty: (result: StoryQuestion[]) => result.length === 0,
	getTable: (db: DataAccess) => ({
		get: (key: string) => db.storyQuestions.get(key),
		put: (entry: unknown) => db.storyQuestions.put(entry as StoryQuestionSet),
	}),
	buildCacheEntry: (
		key: string,
		data: StoryQuestion[],
		ttlMs: number,
		storyId: string,
		_subject: string,
	) =>
		({
			key,
			storyId,
			questions: data,
			createdAt: Date.now(),
			expiresAt: Date.now() + ttlMs,
		}) satisfies StoryQuestionSet,
	extractData: (cached: unknown) => (cached as StoryQuestionSet).questions,
	errorLabel: "StoryService",
	buildCacheKey: (storyId: string, _storyText: string) =>
		`questions:${storyId}`,
};

let _deps: { db: DataAccess } = { db: dexieDataAccess };

function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

function createQuestionsGenerator() {
	return new CachedAIGenerator(questionsConfig, getAI(), _deps.db);
}

export async function getStory(id: string): Promise<Story | null> {
	try {
		const key = `story:${id}`;
		const cached = await _deps.db.storyCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.story;
		}
	} catch {
		// IndexedDB unavailable (server-side)
	}
	return null;
}

export async function cacheStory(id: string, story: Story): Promise<void> {
	try {
		const key = `story:${id}`;
		const entry = {
			key,
			story,
			createdAt: Date.now(),
			expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
		};
		await _deps.db.storyCache.put(entry);
	} catch {
		// IndexedDB unavailable (server-side)
	}
}

export async function generateComprehensionQuestions(
	story: Story,
): Promise<StoryQuestion[]> {
	return createQuestionsGenerator().generate(story.id, story.content);
}

export async function getCachedQuestions(
	storyId: string,
): Promise<StoryQuestion[] | null> {
	return createQuestionsGenerator().getCached(storyId, "");
}

export async function storeQuestions(
	storyId: string,
	questions: StoryQuestion[],
): Promise<void> {
	return createQuestionsGenerator().store(storyId, "", questions);
}
