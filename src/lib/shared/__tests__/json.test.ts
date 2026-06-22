import { describe, expect, test } from "vitest";
import { safeJsonParse, safeJsonStringify } from "../json";

describe("safeJsonParse", () => {
  test("parses valid JSON", () => {
    expect(safeJsonParse('{"a":1}')).toEqual({ a: 1 });
    expect(safeJsonParse("[1,2,3]")).toEqual([1, 2, 3]);
    expect(safeJsonParse('"hello"')).toBe("hello");
  });

  test("returns fallback for invalid JSON", () => {
    expect(safeJsonParse("not json")).toBeNull();
    expect(safeJsonParse("{invalid}")).toBeNull();
  });

  test("uses custom fallback", () => {
    expect(safeJsonParse("bad", {})).toEqual({});
    expect(safeJsonParse("bad", "fallback")).toBe("fallback");
  });

  test("returns typed result", () => {
    const result = safeJsonParse<{ x: number }>('{"x":42}');
    expect(result).toEqual({ x: 42 });
  });
});

describe("safeJsonStringify", () => {
  test("stringifies valid values", () => {
    expect(safeJsonStringify({ a: 1 })).toBe('{"a":1}');
    expect(safeJsonStringify([1, 2, 3])).toBe("[1,2,3]");
    expect(safeJsonStringify("hello")).toBe('"hello"');
  });

  test("returns fallback for circular references", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    expect(safeJsonStringify(circular)).toBe("{}");
  });

  test("uses custom fallback", () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(safeJsonStringify(circular, "[]")).toBe("[]");
  });

  test("stringifies primitives", () => {
    expect(safeJsonStringify(42)).toBe("42");
    expect(safeJsonStringify(null)).toBe("null");
    expect(safeJsonStringify(true)).toBe("true");
  });
});
