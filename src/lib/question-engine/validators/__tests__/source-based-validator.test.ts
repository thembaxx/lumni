import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(
	overrides?: Partial<Question<"source-based">>,
): Question<"source-based"> {
	return {
		id: "q1",
		type: "source-based",
		subject: "history",
		topic: "cold-war",
		difficulty: "Hard",
		bloomTaxonomy: "analyze",
		points: 12,
		questionText: "Analyze the source about the Berlin Wall",
		hint: "Consider perspective",
		explanation: "The source shows Cold War division",
		body: {
			source: { type: "text", content: "The Berlin Wall was built in 1961..." },
			subQuestions: [
				{
					id: "sq1",
					questionText: "When?",
					type: "short-answer",
					points: 4,
					body: {
						modelAnswer: "1961",
						acceptableAnswers: ["1961"],
						maxLength: 50,
					},
				},
			],
		},
		...overrides,
	};
}

describe("Source-based Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
	});

	test("fails on missing source", () => {
		const result = validateQuestion(
			makeQuestion({
				body: { source: undefined as unknown as never, subQuestions: [] },
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on empty subQuestions", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					source: {
						type: "text",
						content:
							"A substantial source text that is long enough to pass validation checks for the source content requirement.",
					},
					subQuestions: [],
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
