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

const mockResolve = mock<(params: unknown) => unknown>();

mock.module("@/lib/visual-engine", () => ({
	VisualEngine: {
		initialize: mock(() => undefined),
	},
	visualEngine: {
		resolve: mockResolve,
	},
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("@/app/api/engine/visual/route");

describe("POST /api/engine/visual", () => {
	beforeEach(() => {
		mockCheckBudget.mockReset();
		mockTrackUsage.mockReset();
		mockWithRateLimit.mockReset();
		mockResolve.mockReset();
	});

	test("parseBody accepts visual params and returns visual", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockResolve.mockResolvedValue({
			type: "geometry",
			data: { shapes: [] },
		});

		const req = new NextRequest("http://localhost/api/engine/visual", {
			method: "POST",
			body: JSON.stringify({
				questionId: "q1",
				questionText: "Draw a triangle",
				subject: "mathematics",
				topic: "geometry",
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.visual).toBeDefined();
		expect(body.visual.type).toBe("geometry");
	});

	test("validate: missing questionId returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/visual", {
			method: "POST",
			body: JSON.stringify({
				questionText: "Draw a triangle",
				subject: "mathematics",
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({
			error: "questionId, questionText, and subject are required",
		});
		expect(mockResolve).not.toHaveBeenCalled();
	});

	test("validate: missing questionText returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/visual", {
			method: "POST",
			body: JSON.stringify({
				questionId: "q1",
				subject: "mathematics",
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({
			error: "questionId, questionText, and subject are required",
		});
	});

	test("validate: missing subject returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/visual", {
			method: "POST",
			body: JSON.stringify({
				questionId: "q1",
				questionText: "Draw a triangle",
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({
			error: "questionId, questionText, and subject are required",
		});
	});

	test("execute resolves visual with correct params", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockResolve.mockResolvedValue({
			type: "chart",
			data: { type: "bar" },
		});

		const req = new NextRequest("http://localhost/api/engine/visual", {
			method: "POST",
			body: JSON.stringify({
				questionId: "q2",
				questionText: "Show data",
				subject: "mathematics",
			}),
		});

		await POST(req);

		expect(mockResolve).toHaveBeenCalledWith({
			questionId: "q2",
			questionText: "Show data",
			subject: "mathematics",
			topic: "",
		});
	});

	test("execute passes topic when provided", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockResolve.mockResolvedValue({ type: "graph", data: {} });

		const req = new NextRequest("http://localhost/api/engine/visual", {
			method: "POST",
			body: JSON.stringify({
				questionId: "q3",
				questionText: "Plot function",
				subject: "mathematics",
				topic: "algebra",
			}),
		});

		await POST(req);

		expect(mockResolve).toHaveBeenCalledWith({
			questionId: "q3",
			questionText: "Plot function",
			subject: "mathematics",
			topic: "algebra",
		});
	});
});
