import { describe, expect, test } from "bun:test";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

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
		hint: "Solve step by step",
		explanation: "Each part builds on the previous",
		body: {
			parts: [
				{
					id: "p1",
					questionText: "Solve 2x = 8",
					type: "short-answer",
					points: 5,
					body: { modelAnswer: "4", acceptableAnswers: ["4"], maxLength: 50 },
				},
				{
					id: "p2",
					questionText: "Solve x + 3 = 7",
					type: "short-answer",
					points: 10,
					body: { modelAnswer: "4", acceptableAnswers: ["4"], maxLength: 50 },
				},
			],
		},
		...overrides,
	};
}

describe("Mixed Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
	});

	test("fails on less than 2 parts", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					parts: [
						{
							id: "p1",
							questionText: "Only part",
							type: "short-answer",
							points: 5,
							body: {
								modelAnswer: "4",
								acceptableAnswers: ["4"],
								maxLength: 50,
							},
						},
					],
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("warns when part points don't sum to question points", () => {
		const result = validateQuestion(makeQuestion({ points: 20 }));
		expect(result.warnings.length).toBeGreaterThanOrEqual(1);
	});
});
