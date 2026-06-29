import { describe, expect, test } from "vitest";
import { evaluate } from "../evaluator";

describe("evaluate", () => {
  test("basic arithmetic", () => {
    expect(evaluate("2 + 2")).toBe(4);
    expect(evaluate("10 - 3")).toBe(7);
    expect(evaluate("4 * 5")).toBe(20);
    expect(evaluate("10 / 2")).toBe(5);
  });

  test("operator precedence", () => {
    expect(evaluate("2 + 3 * 4")).toBe(14);
    expect(evaluate("(2 + 3) * 4")).toBe(20);
    expect(evaluate("10 / 2 + 3")).toBe(8);
  });

  test("exponentiation", () => {
    expect(evaluate("2 ^ 3")).toBe(8);
    expect(evaluate("3 ^ 2")).toBe(9);
    expect(evaluate("2 ^ 0")).toBe(1);
  });

  test("constants pi and e", () => {
    expect(evaluate("pi")).toBeCloseTo(Math.PI);
    expect(evaluate("PI")).toBeCloseTo(Math.PI);
    expect(evaluate("e")).toBeCloseTo(Math.E);
  });

  test("math functions", () => {
    expect(evaluate("sqrt(16)")).toBe(4);
    expect(evaluate("abs(-5)")).toBe(5);
    expect(evaluate("round(4.7)")).toBe(5);
    expect(evaluate("floor(4.7)")).toBe(4);
    expect(evaluate("ceil(4.2)")).toBe(5);
  });

  test("trigonometry", () => {
    expect(evaluate("sin(0)")).toBeCloseTo(0);
    expect(evaluate("cos(0)")).toBeCloseTo(1);
    expect(evaluate("sin(pi / 2)")).toBeCloseTo(1);
  });

  test("natural log", () => {
    expect(evaluate("ln(e)")).toBeCloseTo(1);
  });

  test("complex expressions", () => {
    expect(evaluate("sqrt(pi * 5 ^ 2)")).toBeCloseTo(Math.sqrt(Math.PI * 25));
    expect(evaluate("sin(pi / 4) ^ 2 + cos(pi / 4) ^ 2")).toBeCloseTo(1);
  });

  test("throws on empty string", () => {
    expect(() => evaluate("")).toThrow();
    expect(() => evaluate("  ")).toThrow();
  });

  test("throws on non-string input", () => {
    expect(() => evaluate(null as never)).toThrow();
    expect(() => evaluate(undefined as never)).toThrow();
  });

  test("throws on disallowed characters", () => {
    expect(() => evaluate("2 + eval('alert')")).toThrow();
  });

  test("throws on non-finite result", () => {
    expect(() => evaluate("1/0")).toThrow();
  });
});
