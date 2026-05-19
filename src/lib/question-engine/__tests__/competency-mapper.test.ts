import { describe, expect, test } from "bun:test";
import {
	getCompetencyDescription,
	mapCompetencyToBloom,
	mapCompetencyToBloomList,
	mapCompetencyToDifficulty,
} from "../competency-mapper";

describe("mapCompetencyToBloom", () => {
	test("returns undefined for undefined level", () => {
		expect(mapCompetencyToBloom(undefined, 50)).toBeUndefined();
	});

	test("returns undefined for undefined score", () => {
		expect(mapCompetencyToBloom("novice", undefined)).toBeUndefined();
	});

	test("returns undefined for invalid level", () => {
		expect(mapCompetencyToBloom("invalid" as never, 50)).toBeUndefined();
	});

	test("novice returns remember", () => {
		expect(mapCompetencyToBloom("novice", 50)).toBe("remember");
	});

	test("developing with score < 80 returns understand", () => {
		expect(mapCompetencyToBloom("developing", 70)).toBe("understand");
	});

	test("developing with score >= 80 returns apply", () => {
		expect(mapCompetencyToBloom("developing", 80)).toBe("apply");
		expect(mapCompetencyToBloom("developing", 95)).toBe("apply");
	});

	test("proficient with score < 90 returns apply", () => {
		expect(mapCompetencyToBloom("proficient", 60)).toBe("apply");
	});

	test("proficient with score >= 90 returns evaluate", () => {
		expect(mapCompetencyToBloom("proficient", 90)).toBe("evaluate");
		expect(mapCompetencyToBloom("proficient", 100)).toBe("evaluate");
	});

	test("mastered returns evaluate", () => {
		expect(mapCompetencyToBloom("mastered", 85)).toBe("evaluate");
	});
});

describe("mapCompetencyToDifficulty", () => {
	test("returns undefined for undefined level", () => {
		expect(mapCompetencyToDifficulty(undefined)).toBeUndefined();
	});

	test("returns undefined for invalid level", () => {
		expect(mapCompetencyToDifficulty("invalid" as never)).toBeUndefined();
	});

	test("novice returns Easy", () => {
		expect(mapCompetencyToDifficulty("novice")).toBe("Easy");
	});

	test("developing returns Medium", () => {
		expect(mapCompetencyToDifficulty("developing")).toBe("Medium");
	});

	test("proficient returns Medium", () => {
		expect(mapCompetencyToDifficulty("proficient")).toBe("Medium");
	});

	test("mastered returns Hard", () => {
		expect(mapCompetencyToDifficulty("mastered")).toBe("Hard");
	});
});

describe("mapCompetencyToBloomList", () => {
	test("returns default list for undefined level", () => {
		expect(mapCompetencyToBloomList(undefined)).toEqual([
			"remember",
			"understand",
			"apply",
		]);
	});

	test("returns fallback for invalid level", () => {
		expect(mapCompetencyToBloomList("invalid" as never)).toEqual([
			"remember",
			"understand",
		]);
	});

	test("novice returns remember and understand", () => {
		expect(mapCompetencyToBloomList("novice")).toEqual([
			"remember",
			"understand",
		]);
	});

	test("developing returns understand and apply", () => {
		expect(mapCompetencyToBloomList("developing")).toEqual([
			"understand",
			"apply",
		]);
	});

	test("proficient returns apply, analyze, evaluate", () => {
		expect(mapCompetencyToBloomList("proficient")).toEqual([
			"apply",
			"analyze",
			"evaluate",
		]);
	});

	test("mastered returns evaluate and create", () => {
		expect(mapCompetencyToBloomList("mastered")).toEqual([
			"evaluate",
			"create",
		]);
	});
});

describe("getCompetencyDescription", () => {
	test("returns empty string for undefined level", () => {
		expect(getCompetencyDescription(undefined)).toBe("");
	});

	test("returns description for novice", () => {
		const desc = getCompetencyDescription("novice");
		expect(desc).toContain("foundational");
	});

	test("returns description for developing", () => {
		const desc = getCompetencyDescription("developing");
		expect(desc).toContain("building");
	});

	test("returns description for proficient", () => {
		const desc = getCompetencyDescription("proficient");
		expect(desc).toContain("understanding");
	});

	test("returns description for mastered", () => {
		const desc = getCompetencyDescription("mastered");
		expect(desc).toContain("mastery");
	});
});
