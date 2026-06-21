import { describe, expect, test } from "vitest";
import type { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/ordering";

function makeQuestion(
	overrides?: Partial<Question<"ordering">>,
): Question<"ordering"> {
	return {
		id: "q1",
		type: "ordering",
		subject: "mathematics",
		topic: "algebra",
		difficulty: "Medium",
		bloomTaxonomy: "understand",
		points: 5,
		questionText: "Arrange these steps in order",
		hint: "Think about the logical progression",
		explanation: "The correct order is shown above",
		body: {
			items: [
				{ id: "a", text: "First step" },
				{ id: "b", text: "Second step" },
				{ id: "c", text: "Third step" },
				{ id: "d", text: "Fourth step" },
			],
			correctOrder: ["a", "b", "c", "d"],
			shuffle: true,
		},
		...overrides,
	};
}

describe("Ordering Grader", () => {
	test("exact correct order gets full points", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "ordered-items", value: ["a", "b", "c", "d"] },
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(5);
	});

	test("partially correct order gets partial score", () => {
		const q = makeQuestion({ points: 4 });
		const result = grade(
			q,
			{ type: "ordered-items", value: ["a", "d", "c", "b"] },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(2);
	});

	test("completely wrong order scores proportional", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "ordered-items", value: ["d", "c", "b", "a"] },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("incomplete order scores zero", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "ordered-items", value: ["a", "b"] },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("empty answer scores zero", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "ordered-items", value: [] },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});
});
