import { describe, expect, mock, test } from "bun:test";

const mockCheck = mock(() => ({
	allowed: true,
	remaining: { user: 5, global: 100 },
	resetAt: Date.now() + 3600000,
}));

const mockIncrement = mock(() => {});

mock.module("../daily-call-tracker", () => ({
	dailyCallTracker: {
		check: mockCheck,
		increment: mockIncrement,
	},
	AICallType: undefined,
}));

import { checkBudget, trackUsage } from "../with-budget";

describe("checkBudget", () => {
	test("returns allowed:true when under limit", async () => {
		mockCheck.mockImplementation(() => ({
			allowed: true,
			remaining: { user: 5, global: 100 },
			resetAt: Date.now() + 3600000,
		}));

		const req = new Request("http://localhost", {
			headers: { "x-forwarded-for": "127.0.0.1" },
		});
		const result = await checkBudget(req as never, "generate");
		expect(result.allowed).toBe(true);
		expect(result.userId).toBe("127.0.0.1");
		expect(mockCheck).toHaveBeenCalled();
	});

	test("returns allowed:false with 429 response when over limit", async () => {
		mockCheck.mockImplementation(() => ({
			allowed: false,
			remaining: { user: 0, global: 100 },
			resetAt: Date.now() + 3600000,
		}));

		const req = new Request("http://localhost", {
			headers: { "x-forwarded-for": "127.0.0.1" },
		});
		const result = await checkBudget(req as never, "generate");
		expect(result.allowed).toBe(false);
		expect(result.response).toBeDefined();
		expect(result.response!.status).toBe(429);
	});

	test("falls back to anonymous when no IP headers present", async () => {
		mockCheck.mockImplementation(() => ({
			allowed: true,
			remaining: { user: 5, global: 100 },
			resetAt: Date.now() + 3600000,
		}));

		const req = new Request("http://localhost");
		const result = await checkBudget(req as never, "generate");
		expect(result.userId).toBe("anonymous");
	});

	test("budget response includes rate limit headers", async () => {
		mockCheck.mockImplementation(() => ({
			allowed: false,
			remaining: { user: 0, global: 50 },
			resetAt: 9999999999999,
		}));

		const req = new Request("http://localhost", {
			headers: { "x-forwarded-for": "10.0.0.1" },
		});
		const result = await checkBudget(req as never, "generate");
		const headers = result.response!.headers;
		expect(headers.get("X-Budget-Remaining-User")).toBe("0");
		expect(headers.get("X-Budget-Remaining-Global")).toBe("50");
		expect(headers.get("X-Budget-Reset")).toBe("9999999999999");
	});
});

describe("trackUsage", () => {
	test("calls dailyCallTracker.increment with type and user", () => {
		mockIncrement.mockReset();
		trackUsage("grade", "user-123", 50);
		expect(mockIncrement).toHaveBeenCalledWith("grade", "user-123", 50);
	});

	test("calls increment with defaults", () => {
		mockIncrement.mockReset();
		trackUsage("hint", "anonymous");
		expect(mockIncrement).toHaveBeenCalledWith("hint", "anonymous", undefined);
	});

	test("handles visual call type", () => {
		mockIncrement.mockReset();
		trackUsage("visual", "user-456", 200);
		expect(mockIncrement).toHaveBeenCalledWith("visual", "user-456", 200);
	});
});
