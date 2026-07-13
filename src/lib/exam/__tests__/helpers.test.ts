import { describe, expect, test } from "vitest";
import { getCorrectAnswerText, getAnswerText } from "../helpers";
import type { QuestionPart } from "@/types/exam-paper";

describe("getCorrectAnswerText", () => {
  test("returns empty string when no options", () => {
    const part = { id: "p1", type: "short-answer" } as QuestionPart;
    expect(getCorrectAnswerText(part)).toBe("");
  });

  test("returns empty string when options is null", () => {
    const part = { id: "p1", type: "multiple-choice", options: null } as QuestionPart;
    expect(getCorrectAnswerText(part)).toBe("");
  });

  test("returns empty string when no correct option exists", () => {
    const part = {
      id: "p1",
      type: "multiple-choice",
      options: [
        { id: "A", text: "Option 1", isCorrect: false },
        { id: "B", text: "Option 2", isCorrect: false },
      ],
    } as QuestionPart;
    expect(getCorrectAnswerText(part)).toBe("");
  });

  test("returns single correct option text", () => {
    const part = {
      id: "p1",
      type: "multiple-choice",
      options: [
        { id: "A", text: "Paris", isCorrect: false },
        { id: "B", text: "London", isCorrect: true },
        { id: "C", text: "Berlin", isCorrect: false },
      ],
    } as QuestionPart;
    expect(getCorrectAnswerText(part)).toBe("B. London");
  });

  test("returns all correct options joined by semicolons for multi-correct", () => {
    const part = {
      id: "p1",
      type: "multiple-choice",
      options: [
        { id: "A", text: "x = 2", isCorrect: true },
        { id: "B", text: "y = 3", isCorrect: true },
        { id: "C", text: "x = 4", isCorrect: false },
      ],
    } as QuestionPart;
    expect(getCorrectAnswerText(part)).toBe("A. x = 2; B. y = 3");
  });

  test("returns all correct options when there are more than two", () => {
    const part = {
      id: "p1",
      type: "multiple-choice",
      options: [
        { id: "A", text: "Red", isCorrect: true },
        { id: "B", text: "Green", isCorrect: true },
        { id: "C", text: "Blue", isCorrect: true },
        { id: "D", text: "Yellow", isCorrect: false },
      ],
    } as QuestionPart;
    expect(getCorrectAnswerText(part)).toBe("A. Red; B. Green; C. Blue");
  });
});

describe("getAnswerText", () => {
  test("returns empty string when answer is undefined", () => {
    const part = { id: "p1", type: "multiple-choice" } as QuestionPart;
    expect(getAnswerText(part, undefined)).toBe("");
  });

  test("returns comma-joined string for array values", () => {
    const part = { id: "p1", type: "multiple-choice" } as QuestionPart;
    expect(getAnswerText(part, { value: ["A", "B"] })).toBe("A, B");
  });

  test("returns option label for single string value", () => {
    const part = {
      id: "p1",
      type: "multiple-choice",
      options: [
        { id: "A", text: "Paris", isCorrect: true },
        { id: "B", text: "London", isCorrect: false },
      ],
    } as QuestionPart;
    expect(getAnswerText(part, { value: "A" })).toBe("A. Paris");
  });

  test("returns raw value when part has no options", () => {
    const part = { id: "p1", type: "short-answer" } as QuestionPart;
    expect(getAnswerText(part, { value: "42" })).toBe("42");
  });
});
