import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerate = vi.fn();
const mockGetCached = vi.fn();
const mockStore = vi.fn();

vi.mock("@/lib/ai/client", () => ({
  getAI: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  dexieDataAccess: { studyGuides: {} },
}));

vi.mock("@/lib/ai/cached-ai-generator", () => ({
  CachedAIGenerator: class {
    generate = (...args: unknown[]) => mockGenerate(...args);
    getCached = (...args: unknown[]) => mockGetCached(...args);
    store = (...args: unknown[]) => mockStore(...args);
  },
}));

import { generateLesson, getCachedLesson, storeLesson } from "../service";

const LESSON = {
  id: "lesson-1",
  subjectId: "mathematics",
  topicId: "algebra",
  subtopicId: "linear-equations",
  title: "Linear Equations",
  order: 1,
  prerequisites: [],
  sections: [
    {
      id: "sec-1",
      type: "introduction" as const,
      title: "Introduction",
      content: "Linear equations are equations of degree 1.",
      keyPoints: ["Degree 1", "Straight line"],
    },
    {
      id: "sec-2",
      type: "concept" as const,
      title: "Core Concept",
      content: "The general form is ax + b = c.",
      keyPoints: ["General form", "Solving methods"],
    },
  ],
  vocabulary: [
    {
      word: "variable",
      definition: "A symbol representing an unknown value",
      partOfSpeech: "noun",
      pronunciation: "/ˈvɛəriəbl/",
      language: "en",
    },
  ],
  difficulty: "medium" as const,
  estimatedMinutes: 15,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("generateLesson", () => {
  test("delegates to CachedAIGenerator.generate", async () => {
    mockGenerate.mockResolvedValue(LESSON);

    const result = await generateLesson("mathematics", "algebra", "linear-equations");

    expect(result).toEqual(LESSON);
    expect(mockGenerate).toHaveBeenCalledWith("mathematics", "linear-equations");
  });

  test("returns empty lesson when AI returns empty", async () => {
    const empty = {
      id: "",
      subjectId: "",
      topicId: "",
      subtopicId: "",
      title: "",
      order: 0,
      prerequisites: [],
      sections: [],
      vocabulary: [],
      difficulty: "medium",
      estimatedMinutes: 0,
    };
    mockGenerate.mockResolvedValue(empty);

    const result = await generateLesson("mathematics", "algebra", "nonexistent");

    expect(result.sections).toHaveLength(0);
    expect(result.vocabulary).toHaveLength(0);
  });
});

describe("getCachedLesson", () => {
  test("returns cached lesson when available", async () => {
    mockGetCached.mockResolvedValue(LESSON);

    const result = await getCachedLesson("mathematics", "algebra", "linear-equations");

    expect(result).toEqual(LESSON);
  });

  test("returns null when nothing cached", async () => {
    mockGetCached.mockResolvedValue(null);

    const result = await getCachedLesson("mathematics", "algebra", "linear-equations");

    expect(result).toBeNull();
  });
});

describe("storeLesson", () => {
  test("delegates to CachedAIGenerator.store", async () => {
    mockStore.mockResolvedValue(undefined);

    await storeLesson("mathematics", "algebra", "linear-equations", LESSON);

    expect(mockStore).toHaveBeenCalledWith("mathematics", "linear-equations", LESSON);
  });

  test("stores lesson with all sections intact", async () => {
    const lessonWith3Sections = {
      ...LESSON,
      sections: [
        ...LESSON.sections,
        {
          id: "sec-3",
          type: "worked-example" as const,
          title: "Worked Example",
          content: "Solve 2x + 3 = 7",
          keyPoints: ["Subtract 3", "Divide by 2"],
        },
      ],
    };
    mockStore.mockResolvedValue(undefined);

    await storeLesson("mathematics", "algebra", "linear-equations", lessonWith3Sections);

    const storedLesson = mockStore.mock.calls[0]?.[2];
    expect(storedLesson?.sections).toHaveLength(3);
  });
});
