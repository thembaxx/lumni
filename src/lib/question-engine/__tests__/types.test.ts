import { describe, expect, test } from "vitest";
import type { Question, QuestionType } from "../types";

describe("Question Types", () => {
	test("Question type is discriminated by type field", () => {
		const mcq: Question<"multiple-choice"> = {
			id: "q1",
			type: "multiple-choice",
			subject: "math",
			topic: "algebra",
			difficulty: "Easy",
			bloomTaxonomy: "remember",
			points: 10,
			questionText: "Test?",
			hint: "hint",
			explanation: "explanation",
			body: {
				options: [{ id: "A", text: "1", isCorrect: true }],
				correctOptionId: "A",
				allowMultiple: false,
			},
		};
		expect(mcq.type).toBe("multiple-choice");
		expect(mcq.body.options[0].isCorrect).toBe(true);
	});

	test("Matching question has pairs", () => {
		const q: Question<"matching"> = {
			id: "q2",
			type: "matching",
			subject: "geo",
			topic: "capitals",
			difficulty: "Medium",
			bloomTaxonomy: "remember",
			points: 15,
			questionText: "Match countries to capitals",
			hint: "hint",
			explanation: "exp",
			body: {
				pairs: [{ left: "France", right: "Paris" }],
				shuffle: true,
			},
		};
		expect(q.body.pairs[0].left).toBe("France");
	});

	test("Calculation question has numeric answer", () => {
		const q: Question<"calculation"> = {
			id: "q3",
			type: "calculation",
			subject: "physics",
			topic: "motion",
			difficulty: "Hard",
			bloomTaxonomy: "apply",
			points: 20,
			questionText: "Calculate force",
			hint: "F = ma",
			explanation: "F = 10 * 5 = 50N",
			steps: ["Identify mass", "Apply F = ma"],
			body: {
				formula: "F = ma",
				correctValue: 50,
				unit: "N",
				tolerance: 0.1,
			},
		};
		expect(q.body.correctValue).toBe(50);
		expect(q.body.unit).toBe("N");
	});

	test("Programming question has test cases", () => {
		const q: Question<"programming"> = {
			id: "q4",
			type: "programming",
			subject: "it",
			topic: "functions",
			difficulty: "Hard",
			bloomTaxonomy: "create",
			points: 30,
			questionText: "Write a function",
			hint: "hint",
			explanation: "exp",
			body: {
				language: "python",
				starterCode: "def solve():",
				testCases: [
					{ input: "5", expectedOutput: "25", description: "Square of 5" },
				],
				timeLimit: 5000,
			},
		};
		expect(q.body.language).toBe("python");
		expect(q.body.testCases.length).toBe(1);
	});

	test("QuestionType union includes all 11 types", () => {
		const types: QuestionType[] = [
			"multiple-choice",
			"matching",
			"short-answer",
			"long-answer",
			"essay",
			"calculation",
			"diagram",
			"programming",
			"source-based",
			"data-response",
			"mixed",
		];
		expect(types.length).toBe(11);
	});
});
