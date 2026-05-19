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

const mockGenerateQuestionSet = mock<
	(params: { subject: string; count: number }) => unknown
>();

mock.module("@/lib/orchestrator", () => ({
	LearningOrchestrator: {
		initialize: async () => ({
			generateQuestionSet: mockGenerateQuestionSet,
		}),
	},
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("@/app/api/engine/generate/route");

describe("POST /api/engine/generate", () => {
	beforeEach(() => {
		mockCheckBudget.mockReset();
		mockTrackUsage.mockReset();
		mockWithRateLimit.mockReset();
		mockGenerateQuestionSet.mockReset();
	});

	test("parseBody accepts valid GenerationParams", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockGenerateQuestionSet.mockResolvedValue({
			questions: [{ id: "q1", questionText: "Test?", subject: "math" }],
			count: 1,
			type: "multiple-choice",
			jobIds: [1],
		});

		const req = new NextRequest("http://localhost/api/engine/generate", {
			method: "POST",
			body: JSON.stringify({
				subject: "mathematics",
				topic: "algebra",
				count: 1,
				questionType: "multiple-choice",
				difficulty: "Easy",
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.questions).toBeDefined();
		expect(body.count).toBe(1);
		expect(body.type).toBe("multiple-choice");
	});

	test("validate: missing subject returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/generate", {
			method: "POST",
			body: JSON.stringify({ count: 1 }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ error: "Subject is required" });
		expect(mockGenerateQuestionSet).not.toHaveBeenCalled();
	});

	test("validate: count < 1 returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/generate", {
			method: "POST",
			body: JSON.stringify({ subject: "math", count: 0 }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ error: "Count must be at least 1" });
	});

	test("execute returns questions with count and type", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockGenerateQuestionSet.mockResolvedValue({
			questions: [
				{ id: "q1", questionText: "What is 2+2?", subject: "math" },
			],
			count: 1,
			type: "multiple-choice",
			jobIds: [42, 43],
		});

		const req = new NextRequest("http://localhost/api/engine/generate", {
			method: "POST",
			body: JSON.stringify({ subject: "math", count: 1 }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(body.questions).toHaveLength(1);
		expect(body.count).toBe(1);
		expect(body.requested).toBe(1);
		expect(body.type).toBe("any");
		expect(body.jobIds).toEqual([42, 43]);
		expect(body.partial).toBe(false);
		expect(body.warning).toBeUndefined();
	});

	test("partial delivery sets partial flag and warning", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockGenerateQuestionSet.mockResolvedValue({
			questions: [
				{ id: "q1", questionText: "Q1", subject: "math" },
				{ id: "q2", questionText: "Q2", subject: "math" },
			],
			count: 2,
			type: "multiple-choice",
			jobIds: [1, 2],
		});

		const req = new NextRequest("http://localhost/api/engine/generate", {
			method: "POST",
			body: JSON.stringify({ subject: "math", count: 5 }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(body.partial).toBe(true);
		expect(body.warning).toBe("Only 2 of 5 questions could be generated.");
	});
});
