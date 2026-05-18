import { describe, expect, test } from "bun:test";
import { DailyCallTracker } from "../daily-call-tracker";

describe("DailyCallTracker", () => {
	test("allows requests within budget", () => {
		const tracker = new DailyCallTracker();
		const result = tracker.check("generate", "127.0.0.1");
		expect(result.allowed).toBe(true);
	});

	test("blocks after exhausting per-user limit", () => {
		const tracker = new DailyCallTracker();
		for (let i = 0; i < 20; i++) {
			tracker.increment("generate", "127.0.0.1", 100);
		}
		const result = tracker.check("generate", "127.0.0.1");
		expect(result.allowed).toBe(false);
	});

	test("different users have independent budgets", () => {
		const tracker = new DailyCallTracker();
		for (let i = 0; i < 20; i++) {
			tracker.increment("generate", "user-a", 100);
		}
		const result = tracker.check("generate", "user-b");
		expect(result.allowed).toBe(true);
	});

	test("increment tracks token usage", () => {
		const tracker = new DailyCallTracker();
		tracker.increment("grade", "127.0.0.1", 50);
		tracker.increment("grade", "127.0.0.1", 30);
		const usage = tracker.getUsage("127.0.0.1");
		expect(usage.grade.count).toBe(2);
		expect(usage.grade.tokens).toBe(80);
	});

	test("global budget is shared across users", () => {
		const tracker = new DailyCallTracker();
		for (let i = 0; i < 1000; i++) {
			tracker.increment("generate", `user-${i}`, 100);
		}
		const globalUsage = tracker.getGlobalUsage();
		expect(globalUsage.totalCalls).toBe(1000);
	});
});
