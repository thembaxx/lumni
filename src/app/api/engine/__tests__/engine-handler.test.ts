import { beforeEach, describe, expect, test, mock } from "bun:test";

const mockCheckBudget = mock<(req: unknown, type: string) => unknown>();
const mockTrackUsage = mock<(type: string, userId: string) => void>();
const mockWithRateLimit = mock((handler: unknown) => handler);

mock.module("@/lib/ai/with-budget", () => ({
	checkBudget: mockCheckBudget,
	trackUsage: mockTrackUsage,
}));

mock.module("@/lib/shared/with-rate-limit", () => ({
	withRateLimit: mockWithRateLimit,
}));

const { NextRequest, NextResponse } = await import("next/server");
const { createEngineHandler } = await import(
	"@/lib/api/engine-handler"
);

describe("createEngineHandler", () => {
	beforeEach(() => {
		mockCheckBudget.mockReset();
		mockTrackUsage.mockReset();
		mockWithRateLimit.mockReset();
		mockWithRateLimit.mockImplementation((handler: unknown) => handler);
	});

	test("budget allowed calls parseBody, validate, execute, returns result", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const parseBody = mock(async () => ({ subject: "math", count: 2 }));
		const validate = mock(() => null);
		const execute = mock(async () => ({ questions: [], count: 2 }));

		const handler = createEngineHandler({
			budgetType: "generate",
			errorLabel: "Test",
			parseBody,
			validate,
			execute,
		});

		const req = new NextRequest("http://localhost/api/engine/test", {
			method: "POST",
			body: JSON.stringify({ subject: "math", count: 2 }),
		});

		const res = await handler(req);
		const body = await res.json();

		expect(parseBody).toHaveBeenCalledTimes(1);
		expect(validate).toHaveBeenCalledTimes(1);
		expect(execute).toHaveBeenCalledTimes(1);
		expect(execute).toHaveBeenCalledWith(
			{ subject: "math", count: 2 },
			{ userId: "test-user" },
		);
		expect(body).toEqual({ questions: [], count: 2 });
		expect(mockTrackUsage).toHaveBeenCalledWith("generate", "test-user");
	});

	test("budget denied returns 429 and execute not called", async () => {
		mockCheckBudget.mockResolvedValue({
			allowed: false,
			userId: "test-user",
			response: NextResponse.json(
				{ error: "Daily generation limit reached" },
				{ status: 429 },
			),
		});

		const execute = mock(async () => ({ ok: true }));
		const handler = createEngineHandler({
			budgetType: "generate",
			errorLabel: "Test",
			parseBody: async () => ({}),
			validate: () => null,
			execute,
		});

		const req = new NextRequest("http://localhost/api/engine/test", {
			method: "POST",
		});

		const res = await handler(req);
		const body = await res.json();

		expect(res.status).toBe(429);
		expect(body).toEqual({ error: "Daily generation limit reached" });
		expect(execute).not.toHaveBeenCalled();
		expect(mockTrackUsage).not.toHaveBeenCalled();
	});

	test("validation fails returns 400 and execute not called", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const execute = mock(async () => ({ ok: true }));
		const handler = createEngineHandler({
			budgetType: "generate",
			errorLabel: "Test",
			parseBody: async () => ({ subject: "" }),
			validate: (body) => (!body.subject ? "Subject is required" : null),
			execute,
		});

		const req = new NextRequest("http://localhost/api/engine/test", {
			method: "POST",
		});

		const res = await handler(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ error: "Subject is required" });
		expect(execute).not.toHaveBeenCalled();
	});

	test("execute throws returns 500 with error message", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const execute = mock(async () => {
			throw new Error("Something went wrong");
		});
		const handler = createEngineHandler({
			budgetType: "generate",
			errorLabel: "Test",
			parseBody: async () => ({}),
			validate: () => null,
			execute,
		});

		const req = new NextRequest("http://localhost/api/engine/test", {
			method: "POST",
		});

		const res = await handler(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({ error: "Something went wrong" });
	});

	test("execute throws non-Error returns 500 with generic message", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const execute = mock(async () => {
			throw "string error";
		});
		const handler = createEngineHandler({
			budgetType: "generate",
			errorLabel: "Generate",
			parseBody: async () => ({}),
			validate: () => null,
			execute,
		});

		const req = new NextRequest("http://localhost/api/engine/test", {
			method: "POST",
		});

		const res = await handler(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body).toEqual({ error: "Failed to generate" });
	});

	test("useRateLimit false skips rate limit wrapping", async () => {
		const handler = createEngineHandler({
			budgetType: "generate",
			useRateLimit: false,
			errorLabel: "Test",
			parseBody: async () => ({}),
			validate: () => null,
			execute: async () => ({ ok: true }),
		});

		expect(mockWithRateLimit).not.toHaveBeenCalled();
	});

	test("trackUsage called after successful execution", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const handler = createEngineHandler({
			budgetType: "hint",
			errorLabel: "Test",
			parseBody: async () => ({ question: { id: "q1" } }),
			validate: () => null,
			execute: async () => ({ hint: "Think harder" }),
		});

		const req = new NextRequest("http://localhost/api/engine/test", {
			method: "POST",
		});

		await handler(req);

		expect(mockTrackUsage).toHaveBeenCalledWith("hint", "test-user");
	});
});
