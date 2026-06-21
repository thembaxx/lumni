import { describe, expect, test } from "vitest";
import type { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/match-pairs";

function makeQuestion(
	overrides?: Partial<Question<"match-pairs">>,
): Question<"match-pairs"> {
	return {
		id: "q1",
		type: "match-pairs",
		subject: "mathematics",
		topic: "geometry",
		difficulty: "Medium",
		bloomTaxonomy: "remember",
		points: 6,
		questionText: "Match each shape to its properties",
		hint: "Think about the characteristics",
		explanation: "The correct matches are shown above",
		body: {
			leftItems: [
				{ id: "l1", text: "Square" },
				{ id: "l2", text: "Circle" },
				{ id: "l3", text: "Triangle" },
			],
			rightItems: [
				{ id: "r1", text: "Four equal sides" },
				{ id: "r2", text: "No straight edges" },
				{ id: "r3", text: "Three sides" },
			],
			correctMatches: [
				{ leftId: "l1", rightId: "r1" },
				{ leftId: "l2", rightId: "r2" },
				{ leftId: "l3", rightId: "r3" },
			],
			shuffle: true,
		},
		...overrides,
	};
}

describe("MatchPairs Grader", () => {
	test("all correct matches get full points", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{
				type: "pairs",
				value: { l1: "r1", l2: "r2", l3: "r3" },
			},
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(6);
	});

	test("partial matches get partial score", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{
				type: "pairs",
				value: { l1: "r1", l2: "r3", l3: "r2" },
			},
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(2);
	});

	test("no matches score zero", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{
				type: "pairs",
				value: { l1: "r3", l2: "r1", l3: "r2" },
			},
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("empty answer scores zero", () => {
		const q = makeQuestion();
		const result = grade(q, { type: "pairs", value: {} }, {} as PromptManager);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});
});
