import { beforeEach, describe, expect, test, mock } from "bun:test";

const mockGetNextTopics = mock<(subject: string, competencyMap: unknown) => unknown>();
const mockListDocuments = mock<(collection: string, queries: unknown[]) => unknown>();

mock.module("@/lib/competency-engine", () => ({
	pathEngine: {
		getNextTopics: mockGetNextTopics,
	},
}));

mock.module("@/lib/db/client", () => ({
	COLLECTIONS: { COMPETENCIES: "competencies" },
	listDocuments: mockListDocuments,
}));

const { NextRequest } = await import("next/server");
const { GET } = await import("@/app/api/engine/next-topics/route");

describe("GET /api/engine/next-topics", () => {
	beforeEach(() => {
		mockGetNextTopics.mockReset();
		mockListDocuments.mockReset();
	});

	test("returns 400 when subject is missing", async () => {
		const req = new NextRequest(
			"http://localhost/api/engine/next-topics",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body).toEqual({ error: "Subject is required" });
	});

	test("returns recommendations and summary from pathEngine", async () => {
		mockListDocuments.mockResolvedValue([
			{
				subjectId: "mathematics",
				topicId: "algebra",
				bloomLevel: "remember",
				score: 0.85,
				attempts: 10,
				lastAssessed: 1700000000,
				level: "proficient",
			},
			{
				subjectId: "mathematics",
				topicId: "algebra",
				bloomLevel: "apply",
				score: 0.45,
				attempts: 5,
				lastAssessed: 1700000000,
				level: "developing",
			},
		]);

		mockGetNextTopics.mockResolvedValue([
			{ topicId: "calculus", reason: "Next logical step" },
		]);

		const req = new NextRequest(
			"http://localhost/api/engine/next-topics?subject=mathematics",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.recommendations).toEqual([
			{ topicId: "calculus", reason: "Next logical step" },
		]);
		expect(body.summary).toBeDefined();
		expect(body.summary.total).toBe(2);
	});

	test("computes correct summary stats from competencies", async () => {
		mockListDocuments.mockResolvedValue([
			{
				subjectId: "math",
				topicId: "algebra",
				bloomLevel: "remember",
				score: 0.2,
				attempts: 2,
				lastAssessed: 1700000000,
				level: "novice",
			},
			{
				subjectId: "math",
				topicId: "algebra",
				bloomLevel: "apply",
				score: 0.5,
				attempts: 5,
				lastAssessed: 1700000000,
				level: "developing",
			},
			{
				subjectId: "math",
				topicId: "calculus",
				bloomLevel: "understand",
				score: 0.75,
				attempts: 8,
				lastAssessed: 1700000000,
				level: "proficient",
			},
			{
				subjectId: "math",
				topicId: "calculus",
				bloomLevel: "create",
				score: 0.95,
				attempts: 15,
				lastAssessed: 1700000000,
				level: "mastered",
			},
		]);

		mockGetNextTopics.mockResolvedValue([]);

		const req = new NextRequest(
			"http://localhost/api/engine/next-topics?subject=math",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(body.summary).toEqual({
			total: 4,
			novice: 1,
			developing: 1,
			proficient: 1,
			mastered: 1,
			averageScore: 0.6,
		});
	});

	test("handles empty competencies gracefully", async () => {
		mockListDocuments.mockResolvedValue([]);
		mockGetNextTopics.mockResolvedValue([]);

		const req = new NextRequest(
			"http://localhost/api/engine/next-topics?subject=physics",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(body.summary).toEqual({
			total: 0,
			novice: 0,
			developing: 0,
			proficient: 0,
			mastered: 0,
			averageScore: 0,
		});
	});

	test("falls back from score to proficiency field", async () => {
		mockListDocuments.mockResolvedValue([
			{
				subjectId: "math",
				topicId: "algebra",
				bloomLevel: "remember",
				proficiency: 0.7,
				attempts: 3,
				lastAssessed: 1700000000,
				level: "proficient",
			},
		]);

		mockGetNextTopics.mockResolvedValue([]);

		const req = new NextRequest(
			"http://localhost/api/engine/next-topics?subject=math",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(body.summary.averageScore).toBe(0.7);
	});

	test("returns 500 when pathEngine throws", async () => {
		mockListDocuments.mockResolvedValue([]);
		mockGetNextTopics.mockRejectedValue(new Error("Path engine error"));

		const req = new NextRequest(
			"http://localhost/api/engine/next-topics?subject=math",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Path engine error");
	});

	test("handles non-Error throw with generic message", async () => {
		mockListDocuments.mockResolvedValue([]);
		mockGetNextTopics.mockRejectedValue("string error");

		const req = new NextRequest(
			"http://localhost/api/engine/next-topics?subject=math",
		);

		const res = await GET(req);
		const body = await res.json();

		expect(res.status).toBe(500);
		expect(body.error).toBe("Failed to get next topics");
	});
});
