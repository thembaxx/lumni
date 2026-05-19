import { describe, expect, mock, test } from "bun:test";

const mockQuestions = [
	{
		subject: "math",
		topic: "algebra",
		questions: JSON.stringify([
			{ id: "q1", questionText: "What is 2+2?", topic: "algebra" },
		]),
		cachedAt: Date.now(),
	},
];

const mockWrongAnswers: unknown[] = [];

const mockFlashcards: unknown[] = [];

mock.module("@/lib/db/schema", () => ({
	offlineDB: {
		questions: {
			toArray: () => Promise.resolve(mockQuestions),
		},
		wrongAnswers: {
			toArray: () => Promise.resolve(mockWrongAnswers),
		},
	},
}));

mock.module("@/lib/flashcard-repository", () => ({
	flashcardRepository: {
		getAll: () => Promise.resolve(mockFlashcards),
	},
}));

mock.module("@/lib/utils/storage", () => ({
	loadFromStorage: () => [],
}));

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
