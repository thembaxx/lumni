import { describe, expect, test } from "vitest";

const { normalizeDifficulty, isValidDifficulty, DIFFICULTY_VALUES } = await import("../difficulty");

describe("difficulty shared utilities", () => {
  test("normalizeDifficulty capitalises all variants", () => {
    expect(normalizeDifficulty("easy")).toBe("Easy");
    expect(normalizeDifficulty("Easy")).toBe("Easy");
    expect(normalizeDifficulty("EASY")).toBe("Easy");
    expect(normalizeDifficulty("medium")).toBe("Medium");
    expect(normalizeDifficulty("Medium")).toBe("Medium");
    expect(normalizeDifficulty("hard")).toBe("Hard");
    expect(normalizeDifficulty("Hard")).toBe("Hard");
  });

  test("normalizeDifficulty defaults unknown to Medium", () => {
    expect(normalizeDifficulty("unknown" as string)).toBe("Medium");
  });

  test("isValidDifficulty validates correct values", () => {
    expect(isValidDifficulty("easy")).toBe(false);
    expect(isValidDifficulty("Easy")).toBe(true);
    expect(isValidDifficulty("medium")).toBe(false);
    expect(isValidDifficulty("Medium")).toBe(true);
    expect(isValidDifficulty("hard")).toBe(false);
    expect(isValidDifficulty("Hard")).toBe(true);
    expect(isValidDifficulty("unknown")).toBe(false);
    expect(isValidDifficulty("")).toBe(false);
  });

  test("DIFFICULTY_VALUES contains capitalised values", () => {
    expect(DIFFICULTY_VALUES).toEqual(["Easy", "Medium", "Hard"]);
  });
});
