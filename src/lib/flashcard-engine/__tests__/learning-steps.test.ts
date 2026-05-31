import { describe, expect, test } from "bun:test";
import {
	advanceLearningStep,
	getLearningStepDelay,
	isGraduated,
	isInLearning,
	resetLearningStep,
} from "../learning-steps";

describe("isInLearning", () => {
	test("returns true for step 0", () => {
		expect(isInLearning(0)).toBe(true);
	});

	test("returns true for step > 0", () => {
		expect(isInLearning(5)).toBe(true);
	});

	test("returns false for step -1 (graduated)", () => {
		expect(isInLearning(-1)).toBe(false);
	});

	test("returns false for negative steps below -1", () => {
		expect(isInLearning(-2)).toBe(false);
	});
});

describe("isGraduated", () => {
	test("returns true for step -1", () => {
		expect(isGraduated(-1)).toBe(true);
	});

	test("returns false for step 0", () => {
		expect(isGraduated(0)).toBe(false);
	});

	test("returns false for step 1", () => {
		expect(isGraduated(1)).toBe(false);
	});
});

describe("advanceLearningStep", () => {
	const steps = [1, 10, 1440];

	test("advances from step 0 to step 1 with delay of 10 minutes", () => {
		const result = advanceLearningStep(0, steps);
		expect(result.learningStep).toBe(1);
		expect(result.delayMinutes).toBe(10);
	});

	test("advances from step 1 to step 2 with delay of 1440 minutes", () => {
		const result = advanceLearningStep(1, steps);
		expect(result.learningStep).toBe(2);
		expect(result.delayMinutes).toBe(1440);
	});

	test("graduates from last step (returns -1)", () => {
		const result = advanceLearningStep(2, steps);
		expect(result.learningStep).toBe(-1);
		expect(result.delayMinutes).toBe(0);
	});

	test("stays graduated if called when already at -1", () => {
		const result = advanceLearningStep(-1, steps);
		expect(result.learningStep).toBe(0);
		expect(result.delayMinutes).toBe(1);
	});

	test("works with a single-element steps array", () => {
		const single = [5];
		const result = advanceLearningStep(0, single);
		expect(result.learningStep).toBe(-1);
		expect(result.delayMinutes).toBe(0);
	});
});

describe("resetLearningStep", () => {
	test("returns 0", () => {
		expect(resetLearningStep()).toBe(0);
	});
});

describe("getLearningStepDelay", () => {
	const steps = [1, 10, 1440];

	test("returns delay for step 0", () => {
		expect(getLearningStepDelay(0, steps)).toBe(1);
	});

	test("returns delay for step 1", () => {
		expect(getLearningStepDelay(1, steps)).toBe(10);
	});

	test("returns delay for step 2", () => {
		expect(getLearningStepDelay(2, steps)).toBe(1440);
	});

	test("returns 0 for negative index", () => {
		expect(getLearningStepDelay(-1, steps)).toBe(0);
	});

	test("returns 0 for out of bounds index", () => {
		expect(getLearningStepDelay(10, steps)).toBe(0);
	});

	test("returns 0 for empty steps array", () => {
		expect(getLearningStepDelay(0, [])).toBe(0);
	});
});
