import { CachedAIGenerator } from "@/lib/ai/cached-ai-generator";
import { getAI } from "@/lib/ai/client";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import { getAllStoryMetas, loadStoryContent } from "@/lib/stories/story-data";
import type { Story, StoryQuestion, StoryQuestionSet } from "./types";

// Dexie v33 adds storyCache + storyQuestions tables.

const QUESTIONS_TTL = 30 * 24 * 60 * 60 * 1000;

const QUESTIONS_SYSTEM_PROMPT = `You are a reading comprehension question generator. Given a short story, produce 3-5 comprehension questions that test literal recall, inferential understanding, and critical analysis. Mix question types across these 5 types: mcq, short-answer, fill-in-blank, true-false, matching. Format your response as a JSON array of objects with this schema:
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
For short-answer questions, omit the options field and set correctAnswer to a brief expected response.
For fill-in-blank: Create fill-in-the-blank questions by replacing a key word with "___" in a sentence. Set questionType to "fill-in-blank", provide the sentence in questionText, the missing word as correctAnswer, and the full sentence in sentenceTemplate.
For true-false: Create true/false statements about the story. Set questionType to "true-false", write the statement in questionText, set correctAnswer to "True" or "False".
For matching: Create matching exercises with items in two columns. Set questionType to "matching", write instructions in questionText, provide pairs in pairs array with left and right strings. The correctAnswer should be a string joining left-right pairs.
Use Bloom's taxonomy levels: remember, understand, apply, analyze, evaluate, create. Return ONLY valid JSON.`;

const questionsConfig = {
  systemPrompt: QUESTIONS_SYSTEM_PROMPT,
  ttlMs: QUESTIONS_TTL,
  buildPrompt: (_subject: string, storyText: string) =>
    `Story:\n\n${storyText}\n\nGenerate 3-5 comprehension questions covering literal recall, inference, and critical analysis. Mix mcq, short-answer, fill-in-blank, true-false, and matching types.`,
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
  buildCacheKey: (storyId: string, _storyText: string) => `questions:${storyId}`,
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

export async function cacheAllStories(): Promise<void> {
  try {
    const metas = await getAllStoryMetas();
    const cachedCount = await _deps.db.storyCache.count();
    if (cachedCount >= metas.length) return;
    for (const meta of metas) {
      const key = `story:${meta.id}`;
      const exists = await _deps.db.storyCache.get(key);
      if (exists) continue;
      const story = await loadStoryContent(meta.id);
      if (story) {
        await cacheStory(meta.id, story);
      }
    }
  } catch {
    // fail silently — background caching is non-critical
  }
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

export async function generateComprehensionQuestions(story: Story): Promise<StoryQuestion[]> {
  return createQuestionsGenerator().generate(story.id, story.content);
}

export async function getCachedQuestions(storyId: string): Promise<StoryQuestion[] | null> {
  return createQuestionsGenerator().getCached(storyId, "");
}

export async function storeQuestions(storyId: string, questions: StoryQuestion[]): Promise<void> {
  return createQuestionsGenerator().store(storyId, "", questions);
}

const STORY_GEN_SYSTEM_PROMPT = `You are a children's story writer for South African education. Generate an original short story appropriate for the specified grade level, language, and topic. The story should be engaging, culturally relevant to South Africa, and include educational value.

Return your response as a JSON object with this schema:
{
  "content": "The full story text in markdown format, 300-800 words depending on grade level",
  "vocabulary": [
    {
      "term": "word",
      "definition": "simple definition",
      "partOfSpeech": "noun|verb|adjective|adverb",
      "pronunciation": "phonetic pronunciation",
      "language": "language code"
    }
  ],
  "readTimeMinutes": 5
}

Include 3-8 vocabulary words from the story with simple definitions. For non-English stories, provide vocabulary in the target language with definitions in that language.

Keep the story language-appropriate: when generating in Afrikaans, write in Afrikaans; when generating in isiZulu, write in isiZulu; etc.

Return ONLY valid JSON. Do not include markdown code fences in your response.`;

export async function generateStoryContent(params: {
  language: string;
  languageId: string;
  gradeLevel: string;
  topic: string;
  subject: string;
}): Promise<Pick<Story, "content" | "vocabulary" | "readTimeMinutes"> | null> {
  const prompt = `Generate a short story for a Grade ${params.gradeLevel} student in ${params.language} about "${params.topic}". The subject is ${params.subject}. Write the story entirely in ${params.language}. Include vocabulary words with definitions.`;

  try {
    const ai = getAI();
    const result = await ai.generateWithSystem(STORY_GEN_SYSTEM_PROMPT, prompt);

    if (!result || !("content" in result) || !result.content) {
      return null;
    }
    const content = result.content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*$/g, "")
      .trim();
    return JSON.parse(content) as Pick<Story, "content" | "vocabulary" | "readTimeMinutes">;
  } catch (err) {
    logError("StoryService.generateStoryContent", err);
    return null;
  }
}

export async function storeGeneratedStory(story: Story): Promise<void> {
  try {
    const key = `story:${story.id}`;
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

export async function getCachedStoryById(storyId: string): Promise<Story | null> {
  try {
    const key = `story:${storyId}`;
    const cached = await _deps.db.storyCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.story;
    }
  } catch {
    // IndexedDB unavailable (server-side)
  }
  return null;
}
