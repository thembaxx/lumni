import { describe, expect, test } from "vitest";
import {
  formatSubjectLabel,
  getSubjectAbbr,
  getSubjectHexColor,
  getSubjectName,
  getSubjectOklchColor,
  getSubjectTailwindColor,
} from "../index";

describe("getSubjectName", () => {
  test("returns full name for a known subject", () => {
    expect(getSubjectName("mathematics")).toBe("Mathematics");
  });

  test("returns full name for another known subject", () => {
    expect(getSubjectName("physical-sciences")).toBe("Physical Sciences");
  });

  test("returns the id itself for an unknown subject", () => {
    expect(getSubjectName("unknown-subject")).toBe("unknown-subject");
  });

  test("returns empty string when passed empty string", () => {
    expect(getSubjectName("")).toBe("");
  });

  test("is case sensitive — lowercase id does not match uppercase key", () => {
    const result = getSubjectName("Mathematics");
    expect(result).toBe("Mathematics");
  });

  test("handles compound key with hyphens", () => {
    expect(getSubjectName("english-home-language")).toBe("English Home Language");
  });
});

describe("getSubjectHexColor", () => {
  test("returns a valid hex color for a known subject", () => {
    const color = getSubjectHexColor("mathematics");
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  test("returns fallback gray for an unknown subject", () => {
    expect(getSubjectHexColor("unknown-subject")).toBe("oklch(50% 0.02 265)");
  });

  test("returns fallback gray for empty string", () => {
    expect(getSubjectHexColor("")).toBe("oklch(50% 0.02 265)");
  });

  test("each known subject has a hex color", () => {
    const subjects = [
      "mathematics",
      "physical-sciences",
      "life-sciences",
      "english-home-language",
      "geography",
      "history",
    ];
    for (const id of subjects) {
      expect(getSubjectHexColor(id)).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});

describe("getSubjectTailwindColor", () => {
  test("returns a tailwind class for a known subject", () => {
    const color = getSubjectTailwindColor("mathematics");
    expect(color.startsWith("bg-")).toBe(true);
  });

  test("returns bg-muted for an unknown subject", () => {
    expect(getSubjectTailwindColor("unknown-subject")).toBe("bg-muted");
  });

  test("returns bg-muted for empty string", () => {
    expect(getSubjectTailwindColor("")).toBe("bg-muted");
  });
});

describe("getSubjectOklchColor", () => {
  test("returns oklch string for mathematics", () => {
    const color = getSubjectOklchColor("mathematics");
    expect(color.startsWith("oklch(")).toBe(true);
  });

  test("returns undefined for a subject without oklch color", () => {
    expect(getSubjectOklchColor("life-sciences")).toBeUndefined();
  });

  test("returns undefined for an unknown subject", () => {
    expect(getSubjectOklchColor("unknown-subject")).toBeUndefined();
  });

  test("returns undefined for empty string", () => {
    expect(getSubjectOklchColor("")).toBeUndefined();
  });
});

describe("getSubjectAbbr", () => {
  test("returns abbreviated name for mathematics", () => {
    expect(getSubjectAbbr("mathematics")).toBe("Math");
  });

  test("returns abbreviation for physical-sciences", () => {
    expect(getSubjectAbbr("physical-sciences")).toBe("PhySci");
  });

  test("returns fallback (first 4 chars uppercase) for unknown subject", () => {
    expect(getSubjectAbbr("unknown-subject")).toBe("UNKN");
  });

  test("returns first 4 characters for empty string", () => {
    expect(getSubjectAbbr("")).toBe("");
  });
});

describe("formatSubjectLabel", () => {
  test("returns full name from JSON for a known subject", () => {
    expect(formatSubjectLabel("mathematics")).toBe("Mathematics");
  });

  test("converts kebab-case to title case for unknown subjects", () => {
    expect(formatSubjectLabel("physical-sciences")).toBe("Physical Sciences");
  });

  test("handles single word", () => {
    expect(formatSubjectLabel("design")).toBe("Design");
  });

  test("handles empty string", () => {
    expect(formatSubjectLabel("")).toBe("");
  });

  test("handles underscores", () => {
    expect(formatSubjectLabel("life_sciences")).toBe("Life Sciences");
  });
});

describe("subject data completeness", () => {
  test("all 48 subjects from JSON have an abbreviation defined", () => {
    const ids = [
      "agricultural-management-practices",
      "agricultural-sciences",
      "agricultural-technology",
      "afrikaans-first-additional-language",
      "afrikaans-home-language",
      "business-studies",
      "civil-technology",
      "computer-applications-technology",
      "consumer-studies",
      "dance-studies",
      "design",
      "dramatic-arts",
      "economics",
      "electrical-technology",
      "engineering-graphics-and-design",
      "english-first-additional-language",
      "english-home-language",
      "geography",
      "history",
      "hospitality-studies",
      "information-technology",
      "isi-ndebele-home-language",
      "isi-xhosa-first-additional-language",
      "isi-xhosa-home-language",
      "isi-zulu-first-additional-language",
      "isi-zulu-home-language",
      "life-orientation",
      "life-sciences",
      "mathematical-literacy",
      "mathematics",
      "mechanical-technology",
      "music",
      "physical-sciences",
      "religion-studies",
      "sepedi-first-additional-language",
      "sepedi-home-language",
      "sesotho-first-additional-language",
      "sesotho-home-language",
      "setswana-first-additional-language",
      "setswana-home-language",
      "si-swati-home-language",
      "technical-mathematics",
      "technical-sciences",
      "tourism",
      "tshivenda-home-language",
      "visual-arts",
      "xitsonga-home-language",
      "accounting",
    ];

    for (const id of ids) {
      const name = getSubjectName(id);
      expect(name).not.toBe(id);
      expect(name.length).toBeGreaterThan(0);

      const abbr = getSubjectAbbr(id);
      expect(abbr.length).toBeGreaterThan(0);

      const hex = getSubjectHexColor(id);
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
