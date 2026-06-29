import { describe, expect, test } from "vitest";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "../categories";

describe("CATEGORY_ORDER", () => {
  test("contains all expected categories", () => {
    const expected = [
      "languages",
      "sciences",
      "mathematics",
      "humanities",
      "commerce",
      "agriculture",
      "technology",
      "services",
      "arts",
      "compulsory",
    ];
    expect(CATEGORY_ORDER).toEqual(expected);
  });

  test("every category has a label", () => {
    for (const cat of CATEGORY_ORDER) {
      expect(CATEGORY_LABELS[cat]).toBeDefined();
      expect(CATEGORY_LABELS[cat].length).toBeGreaterThan(0);
    }
  });
});
