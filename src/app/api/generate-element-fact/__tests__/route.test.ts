import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockGenerateWithSystem = mock<(...args: unknown[]) => unknown>();
const mockInitAI = mock<(...args: unknown[]) => unknown>();
const mockIsAIConfigured = mock<(...args: unknown[]) => unknown>();
const mockCheckBudget = mock<(...args: unknown[]) => unknown>();
const mockTrackUsage = mock<(...args: unknown[]) => unknown>();

mock.module("@/lib/ai", () => ({
	generateWithSystem: mockGenerateWithSystem,
	initAI: mockInitAI,
	isAIConfigured: mockIsAIConfigured,
}));

mock.module("@/lib/ai/with-budget", () => ({
	checkBudget: mockCheckBudget,
	trackUsage: mockTrackUsage,
}));

mock.module("@/lib/shared/with-rate-limit", () => ({
	withRateLimit: (handler: unknown) => handler,
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("../route");

describe("POST /api/generate-element-fact", () => {
	beforeEach(() => {
		mockGenerateWithSystem.mockReset();
		mockInitAI.mockReset();
		mockIsAIConfigured.mockReset();
		mockCheckBudget.mockReset();
		mockTrackUsage.mockReset();
	});

	test("missing element data returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("Invalid element data");
	});

	test("invalid element (missing symbol) returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({ element: { atomicNumber: 1, name: "Hydrogen" } }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("Invalid element data");
	});

	test("AI not configured returns static [FIXED] fact", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValueOnce(true).mockReturnValueOnce(false);

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({
				element: { atomicNumber: 1, name: "Hydrogen", symbol: "H" },
			}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.fact).toContain("[FIXED]");
		expect(body.fact).toContain("Hydrogen");
	});

	test("AI configured returns generated fact", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGenerateWithSystem.mockResolvedValue({
			content:
				"Hydrogen is the most abundant element in the universe, making up about 75% of its elemental mass.",
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({
				element: { atomicNumber: 1, name: "Hydrogen", symbol: "H" },
			}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.fact).toContain("Hydrogen");
		expect(body.fact).not.toContain("[FIXED]");
		expect(mockTrackUsage).toHaveBeenCalledWith("generate", "test-user");
	});

	test("budget exceeded returns 429", async () => {
		const mockResponse = new Response(
			JSON.stringify({ error: "Daily generation limit reached" }),
			{ status: 429 },
		);
		mockCheckBudget.mockResolvedValue({
			allowed: false,
			userId: "test-user",
			response: mockResponse,
		});

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({
				element: { atomicNumber: 1, name: "Hydrogen", symbol: "H" },
			}),
		});
		const res = await POST(req);

		expect(res.status).toBe(429);
	});

	test("generated fact too short throws error resulting in 500", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGenerateWithSystem.mockResolvedValue({
			content: "Hi.",
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({
				element: { atomicNumber: 1, name: "Hydrogen", symbol: "H" },
			}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Generated fact is too short or empty");
	});

	test("AI failure returns 500", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGenerateWithSystem.mockResolvedValue({
			available: false,
			error: "All providers failed",
			provider: "none",
		});

		const req = new NextRequest("http://localhost/api/generate-element-fact", {
			method: "POST",
			body: JSON.stringify({
				element: { atomicNumber: 1, name: "Hydrogen", symbol: "H" },
			}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("AI generation failed: All providers failed");
	});
});
