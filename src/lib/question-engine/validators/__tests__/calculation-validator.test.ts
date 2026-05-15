import { describe, expect, test } from "bun:test";
import type { Question } from "@/lib/question-engine/types";
import { validateQuestion } from "..";

function makeQuestion(
	overrides?: Partial<Question<"calculation">>,
): Question<"calculation"> {
	return {
		id: "q1",
		type: "calculation",
		subject: "physical-sciences",
		topic: "forces",
		difficulty: "Medium",
		bloomTaxonomy: "apply",
		points: 10,
		questionText: "Calculate force F = ma",
		hint: "Use F = ma",
		explanation: "F = 5 × 2 = 10N",
		body: { formula: "F = ma", correctValue: 10, unit: "N", tolerance: 0.1 },
		...overrides,
	};
}

describe("Calculation Validator", () => {
	test("passes valid question", () => {
		const result = validateQuestion(makeQuestion());
		expect(result.isValid).toBe(true);
	});

	test("fails on missing correctValue", () => {
		const result = validateQuestion(
			makeQuestion({
				body: { formula: "F=ma", correctValue: NaN, unit: "N", tolerance: 0.1 },
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on empty unit", () => {
		const result = validateQuestion(
			makeQuestion({
				body: { formula: "F=ma", correctValue: 10, unit: "", tolerance: 0.1 },
			}),
		);
		expect(result.isValid).toBe(false);
	});

	test("fails on negative tolerance", () => {
		const result = validateQuestion(
			makeQuestion({
				body: { formula: "F=ma", correctValue: 10, unit: "N", tolerance: -1 },
			}),
		);
		expect(result.isValid).toBe(false);
	});
});
