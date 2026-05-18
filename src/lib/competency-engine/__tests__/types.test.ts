import { describe, expect, test } from "bun:test";
import {
	computeCompetencyLevel,
	computeBloomWeight,
	computeWeightedScore,
} from "../types";

describe("computeCompetencyLevel", () => {
	test("returns novice for score below 40", () => {
		expect(computeCompetencyLevel(0)).toBe("novice");
		expect(computeCompetencyLevel(39)).toBe("novice");
	});

	test("returns developing for score 40-64", () => {
		expect(computeCompetencyLevel(40)).toBe("developing");
		expect(computeCompetencyLevel(50)).toBe("developing");
		expect(computeCompetencyLevel(64)).toBe("developing");
	});

	test("returns proficient for score 65-84", () => {
		expect(computeCompetencyLevel(65)).toBe("proficient");
		expect(computeCompetencyLevel(75)).toBe("proficient");
		expect(computeCompetencyLevel(84)).toBe("proficient");
	});

	test("returns mastered for score >= 85", () => {
		expect(computeCompetencyLevel(85)).toBe("mastered");
		expect(computeCompetencyLevel(100)).toBe("mastered");
	});

	test("handles decimal scores", () => {
		expect(computeCompetencyLevel(39.9)).toBe("novice");
		expect(computeCompetencyLevel(64.9)).toBe("developing");
		expect(computeCompetencyLevel(84.9)).toBe("proficient");
	});

	test("handles negative score as novice", () => {
		expect(computeCompetencyLevel(-5)).toBe("novice");
	});
});

describe("computeBloomWeight", () => {
	const curriculum = {
		topics: [
			{ id: "algebra", bloomTarget: "apply" },
			{ id: "functions", bloomTarget: "analyze" },
		],
	};

	test("returns 1.0 when no curriculum provided", () => {
		expect(computeBloomWeight(null, "algebra", "remember")).toBe(1.0);
	});

	test("returns 1.0 when topic not found", () => {
		expect(computeBloomWeight(curriculum, "unknown", "remember")).toBe(1.0);
	});

	test("returns 1.0 when question level <= target level", () => {
		expect(computeBloomWeight(curriculum, "algebra", "remember")).toBe(1.0);
		expect(computeBloomWeight(curriculum, "algebra", "apply")).toBe(1.0);
	});

	test("returns 0.5 when question level exceeds target level", () => {
		expect(computeBloomWeight(curriculum, "algebra", "analyze")).toBe(0.5);
		expect(computeBloomWeight(curriculum, "algebra", "evaluate")).toBe(0.5);
		expect(computeBloomWeight(curriculum, "algebra", "create")).toBe(0.5);
	});

	test("correctly compares bloom order across topics", () => {
		expect(computeBloomWeight(curriculum, "functions", "remember")).toBe(1.0);
		expect(computeBloomWeight(curriculum, "functions", "apply")).toBe(1.0);
		expect(computeBloomWeight(curriculum, "functions", "analyze")).toBe(1.0);
		expect(computeBloomWeight(curriculum, "functions", "evaluate")).toBe(0.5);
		expect(computeBloomWeight(curriculum, "functions", "create")).toBe(0.5);
	});
});

describe("computeWeightedScore", () => {
	test("returns question score when no prior attempts", () => {
		expect(computeWeightedScore(0, 0, 80, 1)).toBe(80);
	});

	test("averages with equal weight", () => {
		expect(computeWeightedScore(50, 1, 100, 1)).toBe(75);
	});

	test("weights toward more attempts", () => {
		const result = computeWeightedScore(80, 4, 60, 1);
		expect(result).toBe(76);
	});

	test("handles custom weight", () => {
		const result = computeWeightedScore(50, 2, 100, 2);
		expect(result).toBe(75);
	});

	test("handles zero existing attempts with non-zero existing score", () => {
		const result = computeWeightedScore(100, 0, 50, 1);
		expect(result).toBe(50);
	});

	test("handles integer rounding naturally", () => {
		const result = computeWeightedScore(33, 3, 50, 1);
		expect(result).toBe(37.25);
	});
});
