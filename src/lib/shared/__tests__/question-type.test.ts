import { describe, expect, test } from "vitest";
import { serializeQuestionType } from "../question-type";

describe("serializeQuestionType", () => {
  test('returns "any" for undefined', () => {
    expect(serializeQuestionType()).toBe("any");
  });

  test('returns "any" for empty string', () => {
    expect(serializeQuestionType("")).toBe("any");
  });

  test("returns string as-is", () => {
    expect(serializeQuestionType("multiple-choice")).toBe("multiple-choice");
    expect(serializeQuestionType("calculation")).toBe("calculation");
  });

  test("joins array with commas", () => {
    expect(serializeQuestionType(["mcq", "short-answer"])).toBe("mcq,short-answer");
    expect(serializeQuestionType(["a", "b", "c"])).toBe("a,b,c");
  });

  test("handles single-element array", () => {
    expect(serializeQuestionType(["essay"])).toBe("essay");
  });
});
