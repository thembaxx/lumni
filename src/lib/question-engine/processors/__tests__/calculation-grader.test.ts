import { describe, expect, test } from "vitest";
import type { PromptManager } from "../../prompt-manager";
import type { Question } from "../../types";
import { grade } from "../graders/calculation";

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
		questionText: "Calculate force given mass 5kg and acceleration 2m/s²",
		hint: "Use F = ma",
		explanation: "F = 5 × 2 = 10N",
		body: {
			formula: "F = ma",
			correctValue: 10,
			unit: "N",
			tolerance: 0.1,
		},
		...overrides,
	};
}

describe("Calculation Grader", () => {
	test("exact answer with unit is correct", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "numeric", value: { value: 10, unit: "N" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
		expect(result.score).toBe(10);
	});

	test("answer within tolerance is correct", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "numeric", value: { value: 10.05, unit: "N" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
	});

	test("answer outside tolerance is incorrect", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "numeric", value: { value: 11, unit: "N" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("correct value but wrong unit gets partial score", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "numeric", value: { value: 10, unit: "m/s" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(7);
	});

	test("no answer provided is incorrect", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "numeric", value: {} },
			{} as PromptManager,
		);
		expect(result.correct).toBe(false);
		expect(result.score).toBe(0);
	});

	test("unit comparison is case-insensitive", () => {
		const q = makeQuestion();
		const result = grade(
			q,
			{ type: "numeric", value: { value: 10, unit: "n" } },
			{} as PromptManager,
		);
		expect(result.correct).toBe(true);
	});
});
