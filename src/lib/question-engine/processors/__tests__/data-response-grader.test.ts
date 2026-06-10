import { describe, expect, test } from "vitest";
import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { gradeDataResponse as grade } from "../graders/shared";

const prompts = new PromptManager();

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
		hint: "Look at the trend in the data",
		explanation: "The data shows a linear relationship",
		body: {
			data: {
				type: "table",
				title: "Temperature readings",
				headers: ["Day", "Temp"],
				rows: [
					{ Day: "Mon", Temp: 20 },
					{ Day: "Tue", Temp: 22 },
				],
			},
			questions: [
				{
					id: "dq1",
					questionText: "What is the trend?",
					type: "short-answer",
					points: 5,
					body: {
						modelAnswer: "Increasing",
						acceptableAnswers: ["Increasing", "going up"],
						maxLength: 100,
					},
				},
				{
					id: "dq2",
					questionText: "Predict Wednesday",
					type: "short-answer",
					points: 5,
					body: {
						modelAnswer: "24",
						acceptableAnswers: ["24", "about 24"],
						maxLength: 100,
					},
				},
			],
		},
		...overrides,
	};
}

describe("Data Response Grader", () => {
	test("empty answer is handled", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "text", value: "" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.feedback).toContain("No answer");
	});
});
