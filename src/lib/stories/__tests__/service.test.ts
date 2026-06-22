import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerate = vi.fn();
const mockGetCached = vi.fn();
const mockStore = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  getAI: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  dexieDataAccess: { storyCache: {}, storyQuestions: {} },
}));

vi.mock("@/lib/ai/cached-ai-generator", () => ({
  CachedAIGenerator: class {
    generate = (...args: unknown[]) => mockGenerate(...args);
    getCached = (...args: unknown[]) => mockGetCached(...args);
    store = (...args: unknown[]) => mockStore(...args);
  },
}));

import {
  generateComprehensionQuestions,
  getCachedQuestions,
  getStory,
  storeQuestions,
} from "../service";
import type { Story, StoryQuestion } from "../types";

const STORY: Story = {
  id: "story-1",
  title: "The Rainmaker",
  author: "Nadine Gordimer",
  language: "English",
  languageId: "english-home-language",
  subjects: ["english-home-language"],
  source: "ai-generated",
  content: "A short story about rain and hope.",
  gradeLevel: "12",
  wordCount: 1200,
  vocabulary: [],
  topics: ["comprehension"],
};

const QUESTIONS: StoryQuestion[] = [
  {
    id: "q1",
    storyId: "story-1",
    questionText: "What is the main theme?",
    questionType: "short-answer",
    correctAnswer: "Hope",
    explanation: "The story revolves around hope.",
    bloomLevel: "understand",
  },
  {
    id: "q2",
    storyId: "story-1",
    questionText: "Who is the protagonist?",
    questionType: "mcq",
    options: ["A", "B", "C", "D"],
    correctAnswer: "A",
    explanation: "The protagonist is introduced early.",
    bloomLevel: "remember",
  },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateComprehensionQuestions", () => {
  test("delegates to CachedAIGenerator.generate", async () => {
    mockGenerate.mockResolvedValue(QUESTIONS);

    const result = await generateComprehensionQuestions(STORY);

    expect(result).toEqual(QUESTIONS);
    expect(mockGenerate).toHaveBeenCalledWith(STORY.id, STORY.content);
  });

  test("returns empty array when AI returns empty", async () => {
    mockGenerate.mockResolvedValue([]);

    const result = await generateComprehensionQuestions(STORY);

    expect(result).toHaveLength(0);
  });
});

describe("getCachedQuestions", () => {
  test("returns cached questions when available", async () => {
    mockGetCached.mockResolvedValue(QUESTIONS);

    const result = await getCachedQuestions("story-1");

    expect(result).toEqual(QUESTIONS);
  });

  test("returns null on cache miss", async () => {
    mockGetCached.mockResolvedValue(null);

    const result = await getCachedQuestions("story-1");

    expect(result).toBeNull();
  });
});

describe("storeQuestions", () => {
  test("delegates to CachedAIGenerator.store", async () => {
    mockStore.mockResolvedValue(undefined);

    await storeQuestions("story-1", QUESTIONS);

    expect(mockStore).toHaveBeenCalledWith("story-1", "", QUESTIONS);
  });
});

describe("getStory", () => {
  test("returns null on cache miss", async () => {
    const result = await getStory("nonexistent");

    expect(result).toBeNull();
  });
});
