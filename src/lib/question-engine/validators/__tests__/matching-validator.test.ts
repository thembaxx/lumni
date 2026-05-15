import { describe, expect, test } from "bun:test";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

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
		questionText: "Match countries to their capitals",
		hint: "Think about geography",
		explanation: "Correct pairings shown above",
		body: {
			pairs: [
				{ left: "France", right: "Paris" },
				{ left: "Germany", right: "Berlin" },
			],
			shuffle: true,
		},
		...overrides,
	};
}

describe("Matching Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
		expect(result.score).toBeGreaterThan(80);
	});

	test("fails on less than 2 pairs", () => {
		const result = validateQuestion(
			makeQuestion({
				body: { pairs: [{ left: "A", right: "B" }], shuffle: true },
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on duplicate left items", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					pairs: [
						{ left: "A", right: "B" },
						{ left: "A", right: "C" },
						{ left: "D", right: "E" },
					],
					shuffle: true,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on duplicate right items", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					pairs: [
						{ left: "A", right: "X" },
						{ left: "B", right: "X" },
						{ left: "C", right: "Y" },
					],
					shuffle: true,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
