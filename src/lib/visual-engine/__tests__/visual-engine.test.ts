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

	test("excludes english", () => {
		expect(STEM_SUBJECTS.has("english")).toBe(false);
	});

	test("excludes history", () => {
		expect(STEM_SUBJECTS.has("history")).toBe(false);
	});

	test("has at least 20 subjects", () => {
		expect(STEM_SUBJECTS.size).toBeGreaterThanOrEqual(20);
	});
});
