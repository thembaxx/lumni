import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const { mockQuestions, mockWrongAnswers, mockFlashcards } = vi.hoisted(() => ({
  mockQuestions: [
    {
      subject: "math",
      topic: "algebra",
      questions: JSON.stringify([{ id: "q1", questionText: "What is 2+2?", topic: "algebra" }]),
      cachedAt: Date.now(),
    },
  ],
  mockWrongAnswers: [] as unknown[],
  mockFlashcards: [] as unknown[],
}));

beforeEach(() => {
  vi.stubGlobal("fetch", () =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ results: [] }) }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock("@/lib/shared/logger", () => ({ logError: () => {} }));
vi.mock("@/lib/db", () => ({
  dexieDataAccess: {
    questions: { toArray: () => Promise.resolve(mockQuestions) },
    wrongAnswers: { toArray: () => Promise.resolve(mockWrongAnswers) },
    quizAttempts: { toArray: () => Promise.resolve([]) },
    examSessions: { toArray: () => Promise.resolve([]) },
    progress: { toArray: () => Promise.resolve([]) },
  },
}));
vi.mock("@/lib/flashcard-engine", () => ({
  flashcardEngine: { getAll: () => Promise.resolve(mockFlashcards) },
}));
vi.mock("@/lib/utils/storage", () => ({ loadFromStorage: () => [] }));

const { searchAll, searchByType } = await import("../search-service");

describe("searchAll", () => {
  test("returns empty array for empty query", async () => {
    const results = await searchAll("");
    expect(results).toEqual([]);
  });

  test("returns empty array for whitespace-only query", async () => {
    const results = await searchAll("   ");
    expect(results).toEqual([]);
  });

  test("returns empty array for single-character query", async () => {
    const results = await searchAll("a");
    expect(results).toEqual([]);
  });

  test("returns results for valid query matching questions", async () => {
    const results = await searchAll("2+2");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].type).toBe("question");
    expect(results[0].title).toContain("2+2");
  });
});

describe("searchByType", () => {
  test("returns empty array for short query", async () => {
    const results = await searchByType("x", "question");
    expect(results).toEqual([]);
  });

  test("returns empty for unknown type", async () => {
    const results = await searchByType("math", "exam" as never);
    expect(results).toEqual([]);
  });

  test("returns question results for valid query", async () => {
    const results = await searchByType("2+2", "question");
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].type).toBe("question");
  });
});
