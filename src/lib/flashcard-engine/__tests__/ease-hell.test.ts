import { describe, expect, test } from "bun:test";
import { checkEaseHellRecovery } from "../ease-hell";

describe("checkEaseHellRecovery", () => {
	const config = { consecutivePasses: 3, boost: 0.15 };

	test("returns shouldBoost=false when ease factor >= 2.5 even with enough passes", () => {
		const result = checkEaseHellRecovery(2.5, 5, config);
		expect(result.shouldBoost).toBe(false);
		expect(result.newEaseFactor).toBe(2.5);
	});

	test("returns shouldBoost=false when consecutive passes below threshold", () => {
		const result = checkEaseHellRecovery(2.0, 2, config);
		expect(result.shouldBoost).toBe(false);
		expect(result.newEaseFactor).toBe(2.0);
	});

	test("returns shouldBoost=true when ease factor below 2.5 and passes meet threshold", () => {
		const result = checkEaseHellRecovery(2.0, 3, config);
		expect(result.shouldBoost).toBe(true);
		expect(result.newEaseFactor).toBe(2.15);
	});

	test("caps new ease factor at 2.5", () => {
		const result = checkEaseHellRecovery(2.4, 3, config);
		expect(result.shouldBoost).toBe(true);
		expect(result.newEaseFactor).toBe(2.5);
	});

	test("works with a different boost value", () => {
		const customConfig = { consecutivePasses: 2, boost: 0.3 };
		const result = checkEaseHellRecovery(1.8, 2, customConfig);
		expect(result.shouldBoost).toBe(true);
		expect(result.newEaseFactor).toBe(2.1);
	});

	test("works with a different consecutive passes threshold", () => {
		const customConfig = { consecutivePasses: 5, boost: 0.1 };
		const result = checkEaseHellRecovery(2.0, 3, customConfig);
		expect(result.shouldBoost).toBe(false);
	});

	test("does not boost when ease factor is exactly on threshold but passes insufficient", () => {
		const result = checkEaseHellRecovery(2.5, 0, config);
		expect(result.shouldBoost).toBe(false);
		expect(result.newEaseFactor).toBe(2.5);
	});

	test("handles ease factor at 1.3 (minimum) with enough passes", () => {
		const result = checkEaseHellRecovery(1.3, 3, config);
		expect(result.shouldBoost).toBe(true);
		expect(result.newEaseFactor).toBe(1.45);
	});
});
