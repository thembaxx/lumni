import { beforeEach, describe, expect, test, vi } from "vitest";

const mockCheckBudget = vi.fn<(req: unknown, type: string) => unknown>();
const mockTrackUsage = vi.fn<(type: string, userId: string) => void>();
const mockWithRateLimit = vi.fn((handler: unknown) => handler);

vi.mock("@/lib/ai/with-budget", () => ({
	checkBudget: mockCheckBudget,
	trackUsage: mockTrackUsage,
}));

vi.mock("@/lib/shared/with-rate-limit", () => ({
	withRateLimit: mockWithRateLimit,
}));

const mockGradeAndTrack =
	vi.fn<(question: unknown, answer: unknown) => unknown>();

vi.mock("@/lib/orchestrator", () => ({
	LearningOrchestrator: {
		initialize: async () => ({
			gradeAndTrack: mockGradeAndTrack,
		}),
	},
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("@/app/api/engine/grade/route");

describe("POST /api/engine/grade", () => {
	beforeEach(() => {
		mockCheckBudget.mockReset();
		mockTrackUsage.mockReset();
		mockWithRateLimit.mockReset();
		mockGradeAndTrack.mockReset();
	});

	const mockQuestion = {
		id: "q1",
		type: "multiple-choice",
		subject: "math",
		topic: "algebra",
		difficulty: "Easy",
		bloomTaxonomy: "remember",
		points: 1,
		questionText: "What is 2+2?",
		hint: "Think about basic addition",
		explanation: "2+2 equals 4",
		body: {
			options: [
				{ id: "a", text: "3", isCorrect: false },
				{ id: "b", text: "4", isCorrect: true },
			],
			correctOptionId: "b",
			allowMultiple: false,
		},
	};

	const mockAnswer = { type: "option-ids", value: ["b"] };

	test("parseBody accepts question and answer", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockGradeAndTrack.mockResolvedValue({
			result: {
				correct: true,
				score: 1,
				maxScore: 1,
				feedback: "Correct!",
			},
			jobIds: [10],
		});

		const req = new NextRequest("http://localhost/api/engine/grade", {
			method: "POST",
			body: JSON.stringify({
				question: mockQuestion,
				answer: mockAnswer,
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.correct).toBe(true);
		expect(body.score).toBe(1);
		expect(body.feedback).toBe("Correct!");
		expect(body.jobIds).toEqual([10]);
	});

	test("validate: missing question returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/grade", {
			method: "POST",
			body: JSON.stringify({ answer: mockAnswer }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ error: "Question and answer are required" });
		expect(mockGradeAndTrack).not.toHaveBeenCalled();
	});

	test("validate: missing answer returns 400", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

		const req = new NextRequest("http://localhost/api/engine/grade", {
			method: "POST",
			body: JSON.stringify({ question: mockQuestion }),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ error: "Question and answer are required" });
	});

	test("execute calls orchestrator.gradeAndTrack and returns result", async () => {
		mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
		mockGradeAndTrack.mockResolvedValue({
			result: {
				correct: false,
				score: 0,
				maxScore: 1,
				feedback: "Incorrect",
			},
			jobIds: [11, 12],
		});

		const req = new NextRequest("http://localhost/api/engine/grade", {
			method: "POST",
			body: JSON.stringify({
				question: mockQuestion,
				answer: { type: "option-ids", value: ["a"] },
			}),
		});

		const res = await POST(req);
		const body = await res.json();

		expect(body.correct).toBe(false);
		expect(body.score).toBe(0);
		expect(body.jobIds).toEqual([11, 12]);
	});
});
