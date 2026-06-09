import { describe, expect, test } from "bun:test";

import { STEM_SUBJECTS } from "../types";

describe("STEM_SUBJECTS", () => {
	test("includes mathematics", () => {
		expect(STEM_SUBJECTS.has("mathematics")).toBe(true);
	});

	test("includes physical-sciences", () => {
		expect(STEM_SUBJECTS.has("physical-sciences")).toBe(true);
	});

	test("includes life-sciences", () => {
		expect(STEM_SUBJECTS.has("life-sciences")).toBe(true);
	});

	test("includes geography", () => {
		expect(STEM_SUBJECTS.has("geography")).toBe(true);
	});

	test("includes accounting", () => {
		expect(STEM_SUBJECTS.has("accounting")).toBe(true);
	});

	test("has at least 32 subjects after alignment", () => {
		expect(STEM_SUBJECTS.size).toBeGreaterThanOrEqual(32);
	});

	test("includes humanities subjects after alignment", () => {
		expect(STEM_SUBJECTS.has("history")).toBe(true);
	});
});
