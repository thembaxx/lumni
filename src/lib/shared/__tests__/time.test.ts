import { describe, expect, test } from "bun:test";
import { calculateAccuracy, formatTime } from "../time";

describe("formatTime", () => {
	test("formats 0 seconds as 00:00", () => {
		expect(formatTime(0)).toBe("00:00");
	});

	test("formats seconds under 60", () => {
		expect(formatTime(5)).toBe("00:05");
		expect(formatTime(45)).toBe("00:45");
		expect(formatTime(59)).toBe("00:59");
	});

	test("formats minutes and seconds", () => {
		expect(formatTime(60)).toBe("01:00");
		expect(formatTime(90)).toBe("01:30");
		expect(formatTime(150)).toBe("02:30");
	});

	test("formats hours", () => {
		expect(formatTime(3600)).toBe("60:00");
		expect(formatTime(3661)).toBe("61:01");
	});

	test("pads single digit minutes and seconds", () => {
		expect(formatTime(61)).toBe("01:01");
		expect(formatTime(9)).toBe("00:09");
	});

	test("handles large values", () => {
		expect(formatTime(99999)).toBe("1666:39");
	});
});

describe("calculateAccuracy", () => {
	test("returns 100 for perfect score", () => {
		expect(calculateAccuracy(10, 10)).toBe(100);
	});

	test("returns 0 for all wrong", () => {
		expect(calculateAccuracy(0, 10)).toBe(0);
	});

	test("returns 50 for half correct", () => {
		expect(calculateAccuracy(5, 10)).toBe(50);
	});

	test("rounds to nearest integer", () => {
		expect(calculateAccuracy(1, 3)).toBe(33);
		expect(calculateAccuracy(2, 3)).toBe(67);
	});

	test("returns 0 when total is 0", () => {
		expect(calculateAccuracy(0, 0)).toBe(0);
		expect(calculateAccuracy(5, 0)).toBe(0);
	});
});
