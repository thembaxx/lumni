import { describe, expect, test } from "vitest";
import { getDifficultyColor, getQuizDifficultyColor } from "../colors";

describe("getDifficultyColor", () => {
	test("returns color for easy (lowercase)", () => {
		const color = getDifficultyColor("easy");
		expect(color).toContain("bg-success");
		expect(color).toContain("text-success");
	});

	test("returns color for Easy (capitalized)", () => {
		const color = getDifficultyColor("Easy");
		expect(color).toContain("bg-success");
	});

	test("returns color for medium", () => {
		const color = getDifficultyColor("medium");
		expect(color).toContain("bg-warning");
		expect(color).toContain("text-warning");
	});

	test("returns color for hard", () => {
		const color = getDifficultyColor("hard");
		expect(color).toContain("bg-destructive");
		expect(color).toContain("text-destructive");
	});
});

describe("getQuizDifficultyColor", () => {
	test("returns different classes than getDifficultyColor", () => {
		const easy = getQuizDifficultyColor("easy");
		const hard = getQuizDifficultyColor("hard");
		expect(easy).toContain("border-success");
		expect(hard).toContain("border-destructive");
	});
});
