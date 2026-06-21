import { describe, expect, test } from "vitest";
import type { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/fill-in-sequence";

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
		points: 4,
		questionText: "Complete the chemical equation",
		hint: "Balance the atoms",
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

describe("FillInSequence Grader", () => {
	test("all correct answers get full points", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "sequence-blanks", value: { b1: "O₂" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(4);
	});

	test("wrong answer scores zero", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "sequence-blanks", value: { b1: "H₂O" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("case insensitive comparison", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "sequence-blanks", value: { b1: "o₂" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(4);
	});

	test("partial correct gets proportional score", () => {
		const q = makeQuestion({
			body: {
				sequence: [
					{ text: "A + ", blankId: "b1" },
					{ text: " → ", blankId: "b2" },
				],
				blanks: [
					{ id: "b1", correctAnswer: "X", distractors: ["Y"] },
					{ id: "b2", correctAnswer: "Z", distractors: ["W"] },
				],
				shuffleDistractors: true,
			},
			points: 4,
		});
		const result = grade(
			q,
			{ type: "sequence-blanks", value: { b1: "X", b2: "W" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(2);
	});

	test("empty answer scores zero", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "sequence-blanks", value: {} },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});
});
