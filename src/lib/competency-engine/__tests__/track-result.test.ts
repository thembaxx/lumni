import { describe, expect, test, mock } from "bun:test";
import { isPassingScore } from "../track-result";

describe("isPassingScore", () => {
	test("returns true when score/maxScore >= default threshold (0.5)", () => {
		expect(isPassingScore(5, 10)).toBe(true);
		expect(isPassingScore(10, 10)).toBe(true);
		expect(isPassingScore(50, 100)).toBe(true);
	});

	test("returns false when score/maxScore < default threshold", () => {
		expect(isPassingScore(4, 10)).toBe(false);
		expect(isPassingScore(0, 10)).toBe(false);
		expect(isPassingScore(1, 100)).toBe(false);
	});

	test("handles maxScore of 0 by comparing score directly", () => {
		expect(isPassingScore(0.5, 0)).toBe(true);
		expect(isPassingScore(0.4, 0)).toBe(false);
		expect(isPassingScore(1, 0)).toBe(true);
	});

	test("respects custom threshold", () => {
		expect(isPassingScore(80, 100, 0.8)).toBe(true);
		expect(isPassingScore(79, 100, 0.8)).toBe(false);
		expect(isPassingScore(3, 4, 0.75)).toBe(true);
	});

	test("edge cases at boundary values", () => {
		expect(isPassingScore(5, 10, 0.5)).toBe(true);
		expect(isPassingScore(4, 10, 0.5)).toBe(false);
	});
});
