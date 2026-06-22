import { describe, expect, test } from "vitest";
import {
  cleanResponse,
  ensureArray,
  getTextResponse,
  isAIFailure,
  parseAIResponse,
} from "../parse-response";

describe("isAIFailure", () => {
  test("returns true when available is false", () => {
    expect(isAIFailure({ available: false })).toBe(true);
  });

  test("returns false when available is true", () => {
    expect(isAIFailure({ available: true })).toBe(false);
  });

  test("returns false for success response", () => {
    expect(isAIFailure({ content: "hello" })).toBe(false);
  });
});

describe("cleanResponse", () => {
  test("removes json code fence", () => {
    expect(cleanResponse('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });

  test("removes plain code fence", () => {
    expect(cleanResponse("```\ntext\n```")).toBe("text");
  });

  test("trims whitespace", () => {
    expect(cleanResponse("  hello  ")).toBe("hello");
  });

  test("handles clean string unchanged", () => {
    expect(cleanResponse("plain")).toBe("plain");
  });

  test("removes multiple fences", () => {
    expect(cleanResponse("```json\n```\ncontent")).toBe("content");
  });
});

describe("parseAIResponse", () => {
  test("returns null for AI failure", () => {
    const result = parseAIResponse({ available: false }, "fallback");
    expect(result).toBeNull();
  });

  test("returns null for invalid JSON", () => {
    const result = parseAIResponse({ content: "not json" }, "fallback");
    expect(result).toBeNull();
  });

  test("parses valid JSON response", () => {
    const result = parseAIResponse({ content: '{"key":"val"}' }, "fallback");
    expect(result).toEqual({
      data: { key: "val" },
      raw: '{"key":"val"}',
    });
  });

  test("cleans response before parsing", () => {
    const result = parseAIResponse({ content: '```json\n{"a":1}\n```' }, "fallback");
    expect(result).toEqual({ data: { a: 1 }, raw: '{"a":1}' });
  });
});

describe("getTextResponse", () => {
  test("returns null for AI failure", () => {
    expect(getTextResponse({ available: false })).toBeNull();
  });

  test("returns cleaned content for success", () => {
    expect(getTextResponse({ content: "  hello  " })).toBe("hello");
  });
});

describe("ensureArray", () => {
  test("returns array as-is", () => {
    expect(ensureArray([1, 2, 3])).toEqual([1, 2, 3]);
  });

  test("wraps non-array in array", () => {
    expect(ensureArray(42)).toEqual([42]);
  });

  test("wraps string in array", () => {
    expect(ensureArray("hello")).toEqual(["hello"]);
  });

  test("wraps object in array", () => {
    expect(ensureArray({ a: 1 })).toEqual([{ a: 1 }]);
  });
});
