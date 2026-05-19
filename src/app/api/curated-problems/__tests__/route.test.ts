import { describe, expect, test, mock, beforeEach } from "bun:test";

const mockGenerateWithSystem = mock<(...args: unknown[]) => unknown>();
const mockInitAI = mock<(...args: unknown[]) => unknown>();
const mockIsAIConfigured = mock<(...args: unknown[]) => unknown>();
const mockCheckBudget = mock<(...args: unknown[]) => unknown>();
const mockTrackUsage = mock<(...args: unknown[]) => unknown>();

const mockGetSubject = mock<(subjectId: string) => unknown>();
const mockGetTopic = mock<(subjectId: string, topicId: string) => unknown>();

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

mock.module("@/curriculum", () => ({
	curriculumRegistry: {
		getSubject: mockGetSubject,
		getTopic: mockGetTopic,
	},
}));

const { NextRequest, NextResponse } = await import("next/server");
const { POST } = await import("../route");

describe("POST /api/curated-problems", () => {
	beforeEach(() => {
		mockGenerateWithSystem.mockReset();
		mockInitAI.mockReset();
		mockIsAIConfigured.mockReset();
		mockCheckBudget.mockReset();
		mockTrackUsage.mockReset();
		mockGetSubject.mockReset();
		mockGetTopic.mockReset();
	});

	test("missing subject returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toBe("Subject is required");
	});

	test("AI not configured returns 503", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(false);

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "mathematics" }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(503);
		expect(body.error).toBe("AI not configured");
	});

	test("valid request returns problems with subject, topic, count", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGetSubject.mockResolvedValue({
			subjectId: "mathematics",
			subjectName: "Mathematics",
			topics: [{ id: "algebra", name: "Algebra", subtopics: [] }],
		});
		mockGenerateWithSystem.mockResolvedValue({
			content: JSON.stringify([
				{
					questionText: "Solve 2x + 3 = 7",
					solution: "x = 2",
					steps: ["Subtract 3", "Divide by 2"],
					difficulty: "Easy",
				},
				{
					questionText: "Factor x^2 - 4",
					solution: "(x-2)(x+2)",
					steps: ["Difference of squares"],
					difficulty: "Medium",
				},
			]),
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "mathematics", topic: "algebra", count: 2 }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.subject).toBe("mathematics");
		expect(body.count).toBe(2);
		expect(body.problems).toHaveLength(2);
		expect(body.problems[0].questionText).toBe("Solve 2x + 3 = 7");
		expect(body.problems[0].id).toContain("mathematics");
		expect(body.problems[1].difficulty).toBe("Medium");
		expect(mockTrackUsage).toHaveBeenCalledWith("generate", "test-user");
	});

	test("curriculum integration provides topic context", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGetSubject.mockResolvedValue({
			subjectId: "mathematics",
			subjectName: "Mathematics",
			topics: [{ id: "algebra", name: "Algebra", order: 1, prerequisites: [], bloomTarget: "apply", subtopics: [{ id: "algebra-expressions", name: "Expressions and Equations", order: 1 }] }],
		});
		mockGetTopic.mockResolvedValue({
			id: "algebra",
			name: "Algebra",
			subtopics: [{ id: "algebra-expressions", name: "Expressions and Equations", order: 1 }],
		});
		mockGenerateWithSystem.mockResolvedValue({
			content: JSON.stringify([{ questionText: "Test", solution: "Ans", steps: [], difficulty: "Easy" }]),
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "mathematics", topic: "algebra", count: 1 }),
		});
		await POST(req);

		expect(mockGetTopic).toHaveBeenCalledWith("mathematics", "algebra");
	});

	test("JSON parse failure falls back with raw content", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGetSubject.mockResolvedValue({
			subjectId: "mathematics",
			subjectName: "Mathematics",
			topics: [],
		});
		mockGenerateWithSystem.mockResolvedValue({
			content: "Raw non-JSON response with problem text",
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "mathematics", count: 1 }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(body.problems).toHaveLength(1);
		expect(body.problems[0].questionText).toBe("Raw non-JSON response with problem text");
		expect(body.problems[0].difficulty).toBe("Medium");
	});

	test("STEM subjects get LaTeX in system prompt", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGetSubject.mockResolvedValue({
			subjectId: "mathematics",
			subjectName: "Mathematics",
			topics: [],
		});
		mockGenerateWithSystem.mockResolvedValue({
			content: JSON.stringify([{ questionText: "Test", solution: "Ans", steps: [], difficulty: "Easy" }]),
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "mathematics", count: 1 }),
		});
		await POST(req);

		expect(mockGenerateWithSystem).toHaveBeenCalledWith(
			expect.stringContaining("LaTeX math notation"),
			expect.any(String),
			expect.any(Object),
		);
	});

	test("non-STEM subjects get plain text prompt without LaTeX", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGetSubject.mockResolvedValue({
			subjectId: "history",
			subjectName: "History",
			topics: [],
		});
		mockGenerateWithSystem.mockResolvedValue({
			content: JSON.stringify([{ questionText: "Test", solution: "Ans", steps: [], difficulty: "Easy" }]),
			provider: "gemini",
			available: true,
		});

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "history", count: 1 }),
		});
		await POST(req);

		expect(mockGenerateWithSystem).toHaveBeenCalledWith(
			expect.not.stringContaining("LaTeX"),
			expect.any(String),
			expect.any(Object),
		);
	});

	test("AI failure throws error resulting in 500", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockIsAIConfigured.mockReturnValue(true);
		mockGetSubject.mockResolvedValue({
			subjectId: "mathematics",
			subjectName: "Mathematics",
			topics: [],
		});
		mockGenerateWithSystem.mockResolvedValue({
			available: false,
			error: "All providers failed",
			provider: "none",
		});

		const req = new NextRequest("http://localhost/api/curated-problems", {
			method: "POST",
			body: JSON.stringify({ subject: "mathematics", count: 1 }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toContain("AI generation failed");
	});
});
