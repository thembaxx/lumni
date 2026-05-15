import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/ai", () => ({
	getAI: () => ({
		generateWithSystem: async () => ({
			content: "not valid json",
			provider: "mock",
			model: "mock",
		}),
	}),
	isAIConfigured: () => true,
	initAI: () => {},
}));

import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/short-answer";

const prompts = new PromptManager();

function makeQuestion(
	overrides?: Partial<Question<"short-answer">>,
): Question<"short-answer"> {
	return {
		id: "q1",
		type: "short-answer",
		subject: "mathematics",
		topic: "algebra",
		difficulty: "Easy",
		bloomTaxonomy: "remember",
		points: 5,
		questionText: "What is the square root of 9?",
		hint: "Think of a number that multiplied by itself equals 9",
		explanation: "3 × 3 = 9",
		body: {
			modelAnswer: "3",
			acceptableAnswers: ["3", "three", "Three"],
			maxLength: 100,
		},
		...overrides,
	};
}

describe("Short Answer Grader", () => {
	test("exact match via fallback passes", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "3" }, prompts);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(5);
	});

	test("case-insensitive match passes", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "three" }, prompts);
		expect(result.correct).toBe(true);
	});

	test("empty answer is incorrect", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
		expect(result.feedback).toContain("No answer");
	});

	test("null answer is incorrect", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: null }, prompts);
		expect(result.correct).toBe(false);
		expect(result.feedback).toContain("No answer");
	});
});
