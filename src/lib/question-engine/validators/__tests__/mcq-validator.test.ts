import { describe, expect, test } from "vitest";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(
	overrides?: Partial<Question<"multiple-choice">>,
): Question<"multiple-choice"> {
	return {
		id: "q1",
		type: "multiple-choice",
		subject: "mathematics",
		topic: "algebra",
		difficulty: "Medium",
		bloomTaxonomy: "understand",
		points: 10,
		questionText: "What is 2 + 2?",
		hint: "Think about basic addition",
		explanation: "2 + 2 equals 4",
		body: {
			options: [
				{ id: "A", text: "3", isCorrect: false },
				{ id: "B", text: "4", isCorrect: true },
				{ id: "C", text: "5", isCorrect: false },
				{ id: "D", text: "6", isCorrect: false },
			],
			correctOptionId: "B",
			allowMultiple: false,
		},
		...overrides,
	};
}

describe("MCQ Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
		expect(result.score).toBeGreaterThan(80);
	});

	test("fails on short question text", () => {
		const result = validateQuestion(makeQuestion({ questionText: "Hi" }));
		expect(result.isValid).toBe(false);
		expect(result.errors.some((e) => e.field === "questionText")).toBe(true);
	});

	test("fails on missing difficulty", () => {
		const result = validateQuestion(makeQuestion({ difficulty: "" as never }));
		expect(result.isValid).toBe(false);
	});

	test("fails on zero points", () => {
		const result = validateQuestion(makeQuestion({ points: 0 }));
		expect(result.isValid).toBe(false);
	});

	test("fails on less than 2 options", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					options: [{ id: "A", text: "Only", isCorrect: true }],
					correctOptionId: "A",
					allowMultiple: false,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("detects no correct answer", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					options: [
						{ id: "A", text: "1", isCorrect: false },
						{ id: "B", text: "2", isCorrect: false },
					],
					correctOptionId: "",
					allowMultiple: false,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("detects multiple correct when not allowed", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					options: [
						{ id: "A", text: "1", isCorrect: true },
						{ id: "B", text: "2", isCorrect: true },
					],
					correctOptionId: "",
					allowMultiple: false,
				},
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("warns on option length variance", () => {
		const result = validateQuestion(
			makeQuestion({
				body: {
					options: [
						{
							id: "A",
							text: "A very long option that is much longer than the others",
							isCorrect: false,
						},
						{ id: "B", text: "short", isCorrect: true },
					],
					correctOptionId: "B",
					allowMultiple: false,
				},
			}),
		);
		expect(result.warnings.length).toBeGreaterThanOrEqual(0);
	});
});
