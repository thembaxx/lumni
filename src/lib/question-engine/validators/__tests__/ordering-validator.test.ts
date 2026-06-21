import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

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
			],
			correctOrder: ["a", "b", "c"],
			shuffle: true,
		},
		...overrides,
	};
}

describe("Ordering Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
		expect(result.score).toBeGreaterThan(80);
	});

	test("fails on less than 2 items", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					items: [{ id: "a", text: "Only item" }],
					correctOrder: ["a"],
					shuffle: true,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails when correctOrder does not match items", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					items: [
						{ id: "a", text: "First" },
						{ id: "b", text: "Second" },
						{ id: "c", text: "Third" },
					],
					correctOrder: ["a", "b"],
					shuffle: true,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
