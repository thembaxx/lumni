import { describe, expect, test } from "vitest";
import { isMathSubject, getMathSystemPrompt } from "../math-solver";
import { evaluate } from "../evaluator";

describe("isMathSubject", () => {
  test("returns true for known math subjects", () => {
    expect(isMathSubject("algebra")).toBe(true);
    expect(isMathSubject("calculus")).toBe(true);
    expect(isMathSubject("trigonometry")).toBe(true);
    expect(isMathSubject("statistics")).toBe(true);
    expect(isMathSubject("matrix")).toBe(true);
    expect(isMathSubject("pre-algebra")).toBe(true);
    expect(isMathSubject("geometry")).toBe(true);
    expect(isMathSubject("mathematics")).toBe(true);
    expect(isMathSubject("math")).toBe(true);
    expect(isMathSubject("maths")).toBe(true);
  });

  test("case insensitive", () => {
    expect(isMathSubject("Algebra")).toBe(true);
    expect(isMathSubject("ALGEBRA")).toBe(true);
  });

  test("handles whitespace variations", () => {
    expect(isMathSubject("math lit")).toBe(true);
    expect(isMathSubject("Mathematical Literacy")).toBe(true);
  });

  test("returns false for non-math subjects", () => {
    expect(isMathSubject("history")).toBe(false);
    expect(isMathSubject("english")).toBe(false);
    expect(isMathSubject("afrikaans")).toBe(false);
    expect(isMathSubject("")).toBe(false);
    expect(isMathSubject(undefined as never)).toBe(false);
  });
});

describe("getMathSystemPrompt", () => {
  test("includes subject label in prompt", () => {
    const prompt = getMathSystemPrompt("algebra");
    expect(prompt).toContain("Algebra");
    expect(prompt).toContain("calculate");
  });

  test("falls back to general Mathematics", () => {
    const prompt = getMathSystemPrompt("unknown-math");
    expect(prompt).toContain("Mathematics");
  });
});

describe("evaluate (integration)", () => {
  test("realistic Matric-level expressions", () => {
    expect(evaluate("3 * 4 - 2")).toBe(10);
    expect(evaluate("(8 + 2) * (5 - 3)")).toBe(20);
    expect(evaluate("2 * 3.14 * 5")).toBeCloseTo(31.4);
    expect(evaluate("sqrt(144)")).toBe(12);
    expect(evaluate("abs(-10)")).toBe(10);
  });
});
