import { describe, expect, test, vi } from "vitest";

vi.mock("@/lib/ai", () => ({
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
import { gradeMixed as grade } from "../graders/shared";

const prompts = new PromptManager();

function makeQuestion(
	overrides?: Partial<Question<"mixed">>,
): Question<"mixed"> {
	return {
		id: "q1",
		type: "mixed",
		subject: "mathematics",
		topic: "algebra",
		difficulty: "Hard",
		bloomTaxonomy: "evaluate",
		points: 15,
		questionText: "Multiple-part algebra question",
		hint: "Solve each part step by step",
		explanation: "Each part builds on the previous",
		body: {
			parts: [
				{
					id: "p1",
					questionText: "Solve 2x = 8",
					type: "short-answer",
					points: 5,
					body: {
						modelAnswer: "4",
						acceptableAnswers: ["4", "x=4"],
						maxLength: 50,
					},
				},
				{
					id: "p2",
					questionText: "Now solve x + 3 = 7",
					type: "short-answer",
					points: 5,
					body: {
						modelAnswer: "4",
						acceptableAnswers: ["4", "x=4"],
						maxLength: 50,
					},
				},
			],
		},
		...overrides,
	};
}

describe("Mixed Grader", () => {
	test("empty answer is handled", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "mixed", value: "{}" }, prompts);
		expect(result.correct).toBe(false);
	});

	test("null answer is handled", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "mixed", value: null }, prompts);
		expect(result.correct).toBe(false);
	});
});
