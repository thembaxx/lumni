import { describe, expect, test } from "bun:test";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

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
		hint: "Use quicksort",
		explanation: "Sorting rearranges elements",
		body: {
			language: "python",
			starterCode: "def sort(arr): pass",
			testCases: [
				{ input: "[3,1,2]", expectedOutput: "[1,2,3]", description: "Basic" },
			],
			timeLimit: 5000,
		},
		...overrides,
	};
}

describe("Programming Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
	});

	test("fails on missing language", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					language: "",
					starterCode: "",
					testCases: [{ input: "1", expectedOutput: "1", description: "test" }],
					timeLimit: 5000,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on empty testCases", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					language: "python",
					starterCode: "",
					testCases: [],
					timeLimit: 5000,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on testCase missing expectedOutput", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					language: "python",
					starterCode: "",
					testCases: [{ input: "1", expectedOutput: "", description: "test" }],
					timeLimit: 5000,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
