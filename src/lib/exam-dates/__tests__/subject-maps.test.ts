import { describe, expect, test } from "bun:test";

const { getSubjectColor, getSubjectAbbr, subjectColors, subjectAbbrs } =
	await import("../subject-maps");

describe("subject-maps", () => {
	test("getSubjectColor returns known colors", () => {
		expect(getSubjectColor("mathematics")).toContain("bg-");
		expect(getSubjectColor("physical-sciences")).toContain("bg-");
		expect(getSubjectColor("unknown-subject")).toBe("bg-muted");
	});

	test("getSubjectAbbr returns known abbreviations", () => {
		expect(getSubjectAbbr("mathematics")).toBe("Math");
		expect(getSubjectAbbr("physical-sciences")).toBe("PhySci");
		expect(getSubjectAbbr("life-sciences")).toBe("LifeSci");
	});

	test("getSubjectAbbr falls back for unknown", () => {
		const abbr = getSubjectAbbr("unknown-subject");
		expect(abbr).toBe("UNKN");
	});

	test("subjectColors covers all major subjects", () => {
		const required = [
			"mathematics",
			"physical-sciences",
			"life-sciences",
			"english-home-language",
			"history",
			"geography",
		];
		for (const s of required) {
			expect(subjectColors[s]).toBeDefined();
		}
	});

	test("subjectAbbrs covers all major subjects", () => {
		const required = [
			"mathematics",
			"physical-sciences",
			"life-sciences",
			"english-home-language",
			"english-first-additional-language",
		];
		for (const s of required) {
			expect(subjectAbbrs[s]).toBeDefined();
		}
	});
});
