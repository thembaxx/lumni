import { describe, it, expect } from "vitest";
import { evaluate } from "./evaluator";

describe("evaluate", () => {
  it("evaluates simple arithmetic", () => {
    expect(evaluate("2+3")).toBe(5);
    expect(evaluate("10-4")).toBe(6);
    expect(evaluate("3*4")).toBe(12);
    expect(evaluate("10/2")).toBe(5);
    expect(evaluate("7%3")).toBe(1);
  });

  it("handles exponentiation", () => {
    expect(evaluate("2**3")).toBe(8);
    expect(evaluate("2^3")).toBe(8);
    expect(evaluate("9**0.5")).toBe(3);
  });

  it("handles parentheses", () => {
    expect(evaluate("(2+3)*4")).toBe(20);
    expect(evaluate("2*(3+4)")).toBe(14);
  });

  it("handles unary minus", () => {
    expect(evaluate("-5")).toBe(-5);
    expect(evaluate("-(3+2)")).toBe(-5);
    expect(evaluate("3+-2")).toBe(1);
  });

  it("handles math functions", () => {
    expect(evaluate("sqrt(9)")).toBe(3);
    expect(evaluate("abs(-5)")).toBe(5);
    expect(evaluate("round(3.7)")).toBe(4);
    expect(evaluate("floor(3.7)")).toBe(3);
    expect(evaluate("ceil(3.2)")).toBe(4);
    expect(evaluate("sin(0)")).toBe(0);
    expect(evaluate("cos(0)")).toBe(1);
    expect(evaluate("ln(1)")).toBe(0);
    expect(evaluate("exp(0)")).toBe(1);
  });

  it("handles constants", () => {
    expect(evaluate("pi")).toBeCloseTo(Math.PI, 4);
    expect(evaluate("e")).toBeCloseTo(Math.E, 4);
  });

  it("handles precedence correctly", () => {
    expect(evaluate("2+3*4")).toBe(14);
    expect(evaluate("2*3+4")).toBe(10);
    expect(evaluate("2+3+4")).toBe(9);
  });

  it("handles decimals", () => {
    expect(evaluate("3.14*2")).toBeCloseTo(6.28, 5);
    expect(evaluate("0.5+0.25")).toBeCloseTo(0.75, 5);
  });

  it("handles complex expressions", () => {
    expect(evaluate("sqrt(25)+3*2")).toBe(11);
    expect(evaluate("(2+3)*4-6/2")).toBe(17);
  });

  it("throws on invalid expressions", () => {
    expect(() => evaluate("")).toThrow();
    expect(() => evaluate("abc")).toThrow();
    expect(() => evaluate("2+/3")).toThrow();
    expect(() => evaluate("(2+3")).toThrow();
  });

  it("throws on division by zero", () => {
    expect(() => evaluate("1/0")).toThrow();
  });

  it("throws on unexpected tokens after expression", () => {
    expect(() => evaluate("2+3 abc")).toThrow();
  });
});
