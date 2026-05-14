import { describe, expect, test } from "bun:test";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(overrides?: Partial<Question<"essay">>): Question<"essay"> {
	return {
		id: "q1",
		type: "essay",
		subject: "history",
		topic: "cold-war",
		difficulty: "Hard",
		bloomTaxonomy: "evaluate",
		points: 25,
		questionText: "Evaluate the role of nuclear weapons",
		hint: "Consider deterrence",
		explanation: "Nuclear weapons shaped global politics",
		body: {
			rubric: [
				{ name: "Argument", description: "Clear thesis", maxScore: 5 },
				{ name: "Evidence", description: "Examples", maxScore: 5 },
			],
			modelAnswer: "A substantial model answer that evaluates the role of nuclear weapons in the Cold War with sufficient depth and analysis.",
			wordLimit: 1000,
		},
		...overrides,
	};
}

describe("Essay Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
	});

	test("fails on less than 2 rubric criteria", () => {
		const result = validateQuestion(makeQuestion({ body: { rubric: [{ name: "A", description: "desc", maxScore: 5 }], modelAnswer: "long enough answer text here for validation", wordLimit: 1000 } }));
		expect(result.isValid).toBe(false);
	});
});
