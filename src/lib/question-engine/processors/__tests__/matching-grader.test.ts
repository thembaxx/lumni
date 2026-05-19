import { describe, expect, test } from "bun:test";
import type { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/matching";

function makeQuestion(
	overrides?: Partial<Question<"matching">>,
): Question<"matching"> {
	return {
		id: "q1",
		type: "matching",
		subject: "history",
		topic: "capitals",
		difficulty: "Medium",
		bloomTaxonomy: "remember",
		points: 10,
		questionText: "Match countries to capitals",
		hint: "Think about geography",
		explanation: "Correct pairings shown",
		body: {
			pairs: [
				{ left: "France", right: "Paris" },
				{ left: "Germany", right: "Berlin" },
				{ left: "Italy", right: "Rome" },
			],
			shuffle: true,
		},
		...overrides,
	};
}

describe("Matching Grader", () => {
	test("all correct pairs get full points", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{
				type: "pairs",
				value: [
					{ left: "France", right: "Paris" },
					{ left: "Germany", right: "Berlin" },
					{ left: "Italy", right: "Rome" },
				],
			},
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(10);
	});

	test("partial matches get partial score", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{
				type: "pairs",
				value: [
					{ left: "France", right: "Paris" },
					{ left: "Germany", right: "Rome" },
					{ left: "Italy", right: "Berlin" },
				],
			},
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(3);
	});

	test("no matches score zero", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{
				type: "pairs",
				value: [
					{ left: "France", right: "London" },
					{ left: "Germany", right: "Madrid" },
					{ left: "Italy", right: "Lisbon" },
				],
			},
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("empty answer scores zero", () => {
		const q = makeQuestion();
		const result = grade(q, { type: "pairs", value: [] }, {} as PromptManager);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});
});
