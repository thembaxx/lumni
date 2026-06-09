"use client";

import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { StoryDataAccess } from "@/lib/db/data-access";
import type { Question } from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import type { CachedStory, Story, StoryQuestionSet } from "./types";

const _deps: { db: StoryDataAccess } = { db: dexieDataAccess };

const STORY_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;
const QUESTION_CACHE_TTL = 30 * 24 * 60 * 60 * 1000;

const SYSTEM_PROMPT = `You are a comprehension question generator for students.
Given a story text and a subject, generate 3-5 comprehension questions covering:
- Literal (recall facts from the text)
- Inferential (read between the lines)
- Critical (evaluate or judge)

Return valid JSON as an array of Question objects (use the Question type from the question engine).
Each question must have: id, type, subject, topic, questionText, options (for multiple-choice), correctAnswer, explanation, difficulty, bloomLevel, marks.`;

export async function getStory(id: string): Promise<Story | null> {
	try {
		const key = `story-${id}`;
		const cached = await _deps.db.storyCache.get(key);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.story;
		}
	} catch {
		// cache unavailable
	}
	return null;
}

export async function cacheStory(id: string, story: Story): Promise<void> {
	try {
		const key = `story-${id}`;
		const entry: CachedStory = {
			key,
			story,
			fetchedAt: Date.now(),
			expiresAt: Date.now() + STORY_CACHE_TTL,
		};
		await _deps.db.storyCache.put(entry);
	} catch {
		// cache write fail silently
	}
}

export async function getCachedQuestions(
	storyId: string,
): Promise<Question[] | null> {
	try {
		const cached = await _deps.db.storyQuestions.get(storyId);
		if (cached && cached.expiresAt > Date.now()) {
			return cached.questions;
		}
	} catch {
		// cache unavailable
	}
	return null;
}

export async function generateComprehensionQuestions(
	story: Story,
): Promise<Question[]> {
	const cached = await getCachedQuestions(story.id);
	if (cached) return cached;

	const ai = getAI();
	const prompt = `Subject: ${story.subjectId}\nStory title: ${story.title}\nStory text:\n\n${story.content}\n\nGenerate 3-5 comprehension questions. Return valid JSON array.`;

	try {
		const result = await ai.generateWithSystem(SYSTEM_PROMPT, prompt);
		if (!("content" in result) || !result.content) return [];

		const parsed = JSON.parse(result.content) as Question[];
		const questionSet: StoryQuestionSet = {
			storyId: story.id,
			questions: parsed,
			generatedAt: Date.now(),
			expiresAt: Date.now() + QUESTION_CACHE_TTL,
		};
		try {
			await _deps.db.storyQuestions.put(questionSet);
		} catch {
			// cache write fail silently
		}
		return parsed;
	} catch (err) {
		logError("StoryService.generateQuestions", err);
		return [];
	}
}
