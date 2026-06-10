import { describe, expect, test } from "vitest";
import { calculateBackoffDelay } from "../backoff";

describe("calculateBackoffDelay", () => {
	test("exponential growth: delay increases with attempts", () => {
		const d1 = calculateBackoffDelay(1);
		const d2 = calculateBackoffDelay(2);
		const d3 = calculateBackoffDelay(3);
		expect(d2).toBeGreaterThan(d1);
		expect(d3).toBeGreaterThan(d2);
	});

	test("adds jitter of up to 1000ms", () => {
		const delays = Array.from({ length: 50 }, () => calculateBackoffDelay(1));
		const min = Math.min(...delays);
		const max = Math.max(...delays);
		expect(min).toBeGreaterThanOrEqual(1000);
		expect(max).toBeLessThanOrEqual(3000);
	});

	test("caps at 60000ms base + 1000ms jitter", () => {
		const delay = calculateBackoffDelay(100);
		expect(delay).toBeLessThanOrEqual(61000);
		expect(delay).toBeGreaterThanOrEqual(60000);
	});

	test("base delay for 0 attempts is 1000ms + jitter", () => {
		const delay = calculateBackoffDelay(0);
		expect(delay).toBeGreaterThanOrEqual(1000);
		expect(delay).toBeLessThanOrEqual(2000);
	});
});
