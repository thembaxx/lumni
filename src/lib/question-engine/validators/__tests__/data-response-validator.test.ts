import { describe, expect, test } from "bun:test";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(
	overrides?: Partial<Question<"data-response">>,
): Question<"data-response"> {
	return {
		id: "q1",
		type: "data-response",
		subject: "mathematics",
		topic: "statistics",
		difficulty: "Medium",
		bloomTaxonomy: "analyze",
		points: 10,
		questionText: "Interpret the data table",
		hint: "Look at trends",
		explanation: "Data shows a linear relationship",
		body: {
			data: {
				type: "table",
				title: "Temperatures",
				headers: ["Day", "Temp"],
				rows: [{ Day: "Mon", Temp: 20 }],
			},
			questions: [
				{
					id: "dq1",
					questionText: "What is the trend?",
					type: "short-answer",
					points: 5,
					body: {
						modelAnswer: "Increasing",
						acceptableAnswers: ["Increasing"],
						maxLength: 100,
					},
				},
			],
		},
		...overrides,
	};
}

describe("Data Response Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
	});

	test("fails on missing data", () => {
		const result = validateQuestion(
			makeQuestion({ body: { data: undefined!, questions: [] } }),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on empty questions", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					data: { type: "table", title: "T", headers: ["A", "B"], rows: [] },
					questions: [],
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
