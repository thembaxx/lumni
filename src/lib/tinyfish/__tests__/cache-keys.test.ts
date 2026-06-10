import { describe, expect, test } from "vitest";
import { buildGenerateKey, buildSolveKey } from "../cache";

describe("buildGenerateKey", () => {
	test("builds key with subject and topic slug", () => {
		expect(buildGenerateKey("mathematics", "Algebra")).toBe(
			"gen:mathematics:algebra",
		);
	});

	test("slugifies multi-word topics", () => {
		expect(buildGenerateKey("physical-sciences", "Newton's Laws")).toBe(
			"gen:physical-sciences:newton-s-laws",
		);
	});

	test("removes non-alphanumeric chars", () => {
		expect(buildGenerateKey("history", "World War II!!!")).toBe(
			"gen:history:world-war-ii",
		);
	});

	test("trims whitespace", () => {
		expect(buildGenerateKey("mathematics", "  Algebra  ")).toBe(
			"gen:mathematics:algebra",
		);
	});

	test("lowercases input", () => {
		expect(buildGenerateKey("MATHEMATICS", "ALGEBRA")).toBe(
			"gen:mathematics:algebra",
		);
	});

	test("collapses repeated non-alphanumeric chars", () => {
		expect(buildGenerateKey("biology", "cell---structure")).toBe(
			"gen:biology:cell-structure",
		);
	});
});

describe("buildSolveKey", () => {
	test("returns consistent key for same question", () => {
		const k1 = buildSolveKey("What is photosynthesis?");
		const k2 = buildSolveKey("What is photosynthesis?");
		expect(k1).toBe(k2);
	});

	test("is case-insensitive", () => {
		const k1 = buildSolveKey("What is photosynthesis?");
		const k2 = buildSolveKey("WHAT IS PHOTOSYNTHESIS?");
		expect(k1).toBe(k2);
	});

	test("trims whitespace", () => {
		const k1 = buildSolveKey("What is photosynthesis?");
		const k2 = buildSolveKey("  What is photosynthesis?  ");
		expect(k1).toBe(k2);
	});

	test("different questions produce different keys", () => {
		expect(buildSolveKey("a")).not.toBe(buildSolveKey("b"));
	});

	test("prefixes with solve:", () => {
		expect(buildSolveKey("anything").startsWith("solve:")).toBe(true);
	});
});
