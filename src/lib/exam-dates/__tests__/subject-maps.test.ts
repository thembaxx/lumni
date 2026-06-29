import { describe, expect, test } from "vitest";

const { getSubjectColor, getSubjectAbbr } = await import("../subject-maps");

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
});
