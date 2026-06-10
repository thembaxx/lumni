import { describe, expect, test } from "vitest";
import { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/programming";

const prompts = new PromptManager();

function makeQuestion(
	overrides?: Partial<Question<"programming">>,
): Question<"programming"> {
	return {
		id: "q1",
		type: "programming",
		subject: "computer-science",
		topic: "algorithms",
		difficulty: "Medium",
		bloomTaxonomy: "apply",
		points: 15,
		questionText: "Write a function to sort an array",
		hint: "Consider using quicksort or mergesort",
		explanation: "A sorting function rearranges elements in order",
		body: {
			language: "python",
			starterCode: "def sort(arr):\n    pass",
			testCases: [
				{
					input: "[3,1,2]",
					expectedOutput: "[1,2,3]",
					description: "Basic sort",
				},
				{ input: "[]", expectedOutput: "[]", description: "Empty array" },
			],
			timeLimit: 5000,
		},
		...overrides,
	};
}

describe("Programming Grader", () => {
	test("rejects empty code submission", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "code", value: "" }, prompts);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
		expect(result.feedback).toContain("No code");
	});

	test("null code submission is rejected", async () => {
		const q = makeQuestion();
		const result = await grade(q, { type: "code", value: null }, prompts);
		expect(result.correct).toBe(false);
		expect(result.feedback).toContain("No code");
	});
});
