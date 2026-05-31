import { describe, expect, test } from "bun:test";
import { checkLeech } from "../leech-detection";

describe("checkLeech", () => {
	const defaultConfig = { threshold: 8, action: "suspend" as const };

	test("returns isLeech=false when lapses below threshold", () => {
		const result = checkLeech(3, false, defaultConfig);
		expect(result.isLeech).toBe(false);
		expect(result.actionTaken).toBeNull();
		expect(result.newStatus).toBeNull();
	});

	test("returns isLeech=true when lapses reach threshold", () => {
		const result = checkLeech(8, false, defaultConfig);
		expect(result.isLeech).toBe(true);
		expect(result.actionTaken).toBe("suspend");
		expect(result.newStatus).toBe("suspended");
	});

	test("returns isLeech=true when lapses exceed threshold", () => {
		const result = checkLeech(10, false, defaultConfig);
		expect(result.isLeech).toBe(true);
		expect(result.actionTaken).toBe("suspend");
		expect(result.newStatus).toBe("suspended");
	});

	test("returns isLeech=false when already leeched", () => {
		const result = checkLeech(8, true, defaultConfig);
		expect(result.isLeech).toBe(false);
		expect(result.actionTaken).toBeNull();
		expect(result.newStatus).toBeNull();
	});

	test("action=bury returns buried status", () => {
		const config = { threshold: 5, action: "bury" as const };
		const result = checkLeech(5, false, config);
		expect(result.isLeech).toBe(true);
		expect(result.actionTaken).toBe("bury");
		expect(result.newStatus).toBe("buried");
	});

	test("action=tag-only returns isLeech=true with no status change", () => {
		const config = { threshold: 3, action: "tag-only" as const };
		const result = checkLeech(3, false, config);
		expect(result.isLeech).toBe(true);
		expect(result.actionTaken).toBe("tag-only");
		expect(result.newStatus).toBeNull();
	});

	test("0 lapses never triggers leech detection", () => {
		const result = checkLeech(0, false, defaultConfig);
		expect(result.isLeech).toBe(false);
	});

	test("exactly at threshold-1 does not trigger", () => {
		const result = checkLeech(7, false, defaultConfig);
		expect(result.isLeech).toBe(false);
	});

	test("threshold of 1 triggers on first failure", () => {
		const config = { threshold: 1, action: "suspend" as const };
		const result = checkLeech(1, false, config);
		expect(result.isLeech).toBe(true);
		expect(result.newStatus).toBe("suspended");
	});
});
