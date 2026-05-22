import { describe, expect, test } from "bun:test";

const {
	normalizeDifficulty,
	isValidDifficulty,
	DIFFICULTY_VALUES,
	DIFFICULTY_INPUT_VALUES,
} = await import("../difficulty");

describe("difficulty shared utilities", () => {
	test("normalizeDifficulty lowercases all variants", () => {
		expect(normalizeDifficulty("easy")).toBe("easy");
		expect(normalizeDifficulty("Easy")).toBe("easy");
		expect(normalizeDifficulty("EASY")).toBe("easy");
		expect(normalizeDifficulty("medium")).toBe("medium");
		expect(normalizeDifficulty("Medium")).toBe("medium");
		expect(normalizeDifficulty("hard")).toBe("hard");
		expect(normalizeDifficulty("Hard")).toBe("hard");
	});

	test("normalizeDifficulty passes through unknown values", () => {
		expect(normalizeDifficulty("unknown" as string)).toBe("unknown");
	});

	test("isValidDifficulty validates correct values", () => {
		expect(isValidDifficulty("easy")).toBe(true);
		expect(isValidDifficulty("Easy")).toBe(true);
		expect(isValidDifficulty("medium")).toBe(true);
		expect(isValidDifficulty("hard")).toBe(true);
		expect(isValidDifficulty("unknown")).toBe(false);
		expect(isValidDifficulty("")).toBe(false);
	});

	test("DIFFICULTY_VALUES contains lowercase values", () => {
		expect(DIFFICULTY_VALUES).toEqual(["easy", "medium", "hard"]);
	});

	test("DIFFICULTY_INPUT_VALUES includes both cases", () => {
		expect(DIFFICULTY_INPUT_VALUES).toEqual([
			"easy",
			"medium",
			"hard",
			"Easy",
			"Medium",
			"Hard",
		]);
	});
});
