import { beforeEach, describe, expect, test } from "bun:test";
import { createDailyLimits } from "../daily-limits";

// In non-browser environments (bun test), daily-limits gracefully
// skips localStorage persistence. These tests verify the module's
// API contract works correctly regardless of environment.

describe("createDailyLimits", () => {
	let limits: ReturnType<typeof createDailyLimits>;

	beforeEach(() => {
		limits = createDailyLimits();
		limits.resetDailyBudget();
	});

	test("getDailyRemaining returns max when nothing consumed", () => {
		const remaining = limits.getDailyRemaining(20, 200);
		expect(remaining.newRemaining).toBe(20);
		expect(remaining.reviewsRemaining).toBe(200);
	});

	test("consumeNewCard always returns true (graceful non-browser)", () => {
		expect(limits.consumeNewCard(20)).toBe(true);
	});

	test("consumeReview always returns true (graceful non-browser)", () => {
		expect(limits.consumeReview(200)).toBe(true);
	});

	test("resetDailyBudget does not throw", () => {
		expect(() => limits.resetDailyBudget()).not.toThrow();
	});

	test("getNewCardLimit returns min of count and maxNew", () => {
		expect(limits.getNewCardLimit(10, 15)).toBe(10);
		expect(limits.getNewCardLimit(10, 5)).toBe(5);
	});

	test("getNewCardLimit with maxNew=0 always returns 0", () => {
		expect(limits.getNewCardLimit(0, 100)).toBe(0);
	});

	test("getReviewLimit returns min of count and maxReviews", () => {
		expect(limits.getReviewLimit(200, 100)).toBe(100);
		expect(limits.getReviewLimit(50, 200)).toBe(50);
	});

	test("getReviewLimit with maxReviews=0 always returns 0", () => {
		expect(limits.getReviewLimit(0, 100)).toBe(0);
	});

	test("getDailyRemaining caps at 0 when limits are 0", () => {
		const remaining = limits.getDailyRemaining(0, 0);
		expect(remaining.newRemaining).toBe(0);
		expect(remaining.reviewsRemaining).toBe(0);
	});
});
