import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(
	overrides?: Partial<Question<"fill-in-sequence">>,
): Question<"fill-in-sequence"> {
	return {
		id: "q1",
		type: "fill-in-sequence",
		subject: "physical-sciences",
		topic: "chemistry",
		difficulty: "Medium",
		bloomTaxonomy: "apply",
		points: 3,
		questionText: "Complete the equation",
		hint: "Balance it",
		explanation: "The balanced equation is shown above",
		body: {
			sequence: [
				{ text: "2H₂ + " },
				{ text: "", blankId: "b1" },
				{ text: " → 2H₂O" },
			],
			blanks: [{ id: "b1", correctAnswer: "O₂", distractors: ["O", "H₂O"] }],
			shuffleDistractors: true,
		},
		...overrides,
	};
}

describe("FillInSequence Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
		expect(result.score).toBeGreaterThan(80);
	});

	test("fails on less than 2 sequence items", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					sequence: [{ text: "Only item" }],
					blanks: [{ id: "b1", correctAnswer: "X" }],
					shuffleDistractors: true,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on no blanks", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					sequence: [{ text: "A" }, { text: "B" }],
					blanks: [],
					shuffleDistractors: true,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
