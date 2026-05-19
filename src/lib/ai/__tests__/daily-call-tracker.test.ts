import { describe, expect, test } from "bun:test";
import { DailyCallTracker } from "../daily-call-tracker";

describe("DailyCallTracker", () => {
	test("allows requests within budget", async () => {
		const tracker = new DailyCallTracker();
		const result = await tracker.check("generate", "127.0.0.1");
		expect(result.allowed).toBe(true);
	});

	test("blocks after exhausting per-user limit", async () => {
		const tracker = new DailyCallTracker();
		for (let i = 0; i < 20; i++) {
			await tracker.increment("generate", "127.0.0.1", 100);
		}
		const result = await tracker.check("generate", "127.0.0.1");
		expect(result.allowed).toBe(false);
	});

	test("different users have independent budgets", async () => {
		const tracker = new DailyCallTracker();
		for (let i = 0; i < 20; i++) {
			await tracker.increment("generate", "user-a", 100);
		}
		const result = await tracker.check("generate", "user-b");
		expect(result.allowed).toBe(true);
	});

	test("increment tracks token usage", async () => {
		const tracker = new DailyCallTracker();
		await tracker.increment("grade", "127.0.0.1", 50);
		await tracker.increment("grade", "127.0.0.1", 30);
		const usage = await tracker.getUsage("127.0.0.1");
		expect(usage.grade.count).toBe(2);
		expect(usage.grade.tokens).toBe(80);
	});

	test("global budget is shared across users", async () => {
		const tracker = new DailyCallTracker();
		for (let i = 0; i < 1000; i++) {
			await tracker.increment("generate", `user-${i}`, 100);
		}
		const globalUsage = await tracker.getGlobalUsage();
		expect(globalUsage.totalCalls).toBe(1000);
	});
});
