import { describe, expect, test } from "bun:test";
import { isBudgetExceeded } from "../api-fetch";

describe("isBudgetExceeded", () => {
	test("returns true for error with limitReached", () => {
		const error = new Error("Budget exceeded");
		(error as Record<string, unknown>).limitReached = true;
		expect(isBudgetExceeded(error)).toBe(true);
	});

	test("returns false for regular error", () => {
		expect(isBudgetExceeded(new Error("Something else"))).toBe(false);
	});

	test("returns false for non-Error objects", () => {
		expect(isBudgetExceeded({ message: "hi" })).toBe(false);
	});

	test("returns false for null", () => {
		expect(isBudgetExceeded(null)).toBe(false);
	});

	test("returns false for undefined", () => {
		expect(isBudgetExceeded(undefined)).toBe(false);
	});

	test("returns false when limitReached is false", () => {
		const error = new Error("Nope");
		(error as Record<string, unknown>).limitReached = false;
		expect(isBudgetExceeded(error)).toBe(false);
	});

	test("returns false for string primitive", () => {
		expect(isBudgetExceeded("error string")).toBe(false);
	});
});
