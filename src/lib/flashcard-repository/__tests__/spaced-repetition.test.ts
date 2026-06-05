import { describe, expect, test } from "bun:test";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { calculateNextReview } from "@/lib/flashcard-engine/algorithms";

const getMasteryLevel = (interval: number) =>
	flashcardEngine.getMasteryLevel(interval);
const getIntervalLabel = (interval: number) =>
	flashcardEngine.getIntervalLabel(interval);

describe("calculateNextReview (SM-2)", () => {
	test("quality < 3 resets repetitions to 0 and interval to 1", () => {
		const result = calculateNextReview(0, 2.5, 10, 5);
		expect(result.repetitions).toBe(0);
		expect(result.interval).toBe(1);
	});

	test("quality 0 reduces ease factor", () => {
		const result = calculateNextReview(0, 2.5, 10, 5);
		expect(result.easeFactor).toBeLessThan(2.5);
	});

	test("quality 1 reduces ease factor less than quality 0", () => {
		const r0 = calculateNextReview(0, 2.5, 10, 5);
		const r1 = calculateNextReview(1, 2.5, 10, 5);
		expect(r1.easeFactor).toBeGreaterThan(r0.easeFactor);
	});

	test("quality 2 decreases ease factor but less than quality 0/1", () => {
		const r0 = calculateNextReview(0, 2.5, 10, 5);
		const r2 = calculateNextReview(2, 2.5, 10, 5);
		expect(r2.easeFactor).toBeGreaterThan(r0.easeFactor);
		expect(r2.easeFactor).toBe(2.18);
	});

	test("first review with quality >= 3 sets interval to 1", () => {
		const result = calculateNextReview(3, 2.5, 0, 0);
		expect(result.repetitions).toBe(1);
		expect(result.interval).toBe(1);
	});

	test("second review with quality >= 3 sets interval to 6", () => {
		const result = calculateNextReview(4, 2.5, 1, 1);
		expect(result.repetitions).toBe(2);
		expect(result.interval).toBe(6);
	});

	test("third+ review multiplies interval by ease factor", () => {
		const result = calculateNextReview(4, 2.5, 6, 2);
		expect(result.repetitions).toBe(3);
		expect(result.interval).toBe(15);
	});

	test("ease factor never drops below 1.3", () => {
		const result = calculateNextReview(0, 1.3, 5, 3);
		expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
	});

	test("quality 5 gives maximum ease factor boost", () => {
		const result = calculateNextReview(5, 2.5, 10, 5);
		expect(result.easeFactor).toBe(2.6);
	});

	test("correct after prior failure resets from interval 1", () => {
		const fail = calculateNextReview(0, 2.5, 30, 10);
		expect(fail.repetitions).toBe(0);
		expect(fail.interval).toBe(1);

		const pass = calculateNextReview(
			4,
			fail.easeFactor,
			fail.interval,
			fail.repetitions,
		);
		expect(pass.repetitions).toBe(1);
		expect(pass.interval).toBe(1);
	});

	test("handles large intervals without overflow", () => {
		const result = calculateNextReview(5, 2.5, 365, 10);
		expect(result.interval).toBe(949);
		expect(result.repetitions).toBe(11);
	});

	test("ease factor is rounded to 2 decimal places", () => {
		const result = calculateNextReview(3, 2.0, 5, 3);
		const decimalPlaces =
			result.easeFactor.toString().split(".")[1]?.length ?? 0;
		expect(decimalPlaces).toBeLessThanOrEqual(2);
	});
});

describe("getMasteryLevel", () => {
	test("interval 0 returns new", () => {
		expect(getMasteryLevel(0)).toBe("new");
	});

	test("interval < 7 returns learning", () => {
		expect(getMasteryLevel(1)).toBe("learning");
		expect(getMasteryLevel(6)).toBe("learning");
	});

	test("interval 7-20 returns reviewing", () => {
		expect(getMasteryLevel(7)).toBe("reviewing");
		expect(getMasteryLevel(14)).toBe("reviewing");
		expect(getMasteryLevel(20)).toBe("reviewing");
	});

	test("interval >= 21 returns mastered", () => {
		expect(getMasteryLevel(21)).toBe("mastered");
		expect(getMasteryLevel(365)).toBe("mastered");
	});
});

describe("getIntervalLabel", () => {
	test('interval 0 returns "New"', () => {
		expect(getIntervalLabel(0)).toBe("New");
	});

	test('interval 1 returns "1 day"', () => {
		expect(getIntervalLabel(1)).toBe("1 day");
	});

	test('interval 2-6 returns "{n} days"', () => {
		expect(getIntervalLabel(2)).toBe("2 days");
		expect(getIntervalLabel(6)).toBe("6 days");
	});

	test('interval 7-29 returns "{n} weeks"', () => {
		expect(getIntervalLabel(7)).toBe("1 weeks");
		expect(getIntervalLabel(14)).toBe("2 weeks");
	});

	test('interval 30-364 returns "{n} months"', () => {
		expect(getIntervalLabel(30)).toBe("1 months");
		expect(getIntervalLabel(60)).toBe("2 months");
	});

	test('interval >= 365 returns "{n} years"', () => {
		expect(getIntervalLabel(365)).toBe("1 years");
		expect(getIntervalLabel(730)).toBe("2 years");
	});
});
