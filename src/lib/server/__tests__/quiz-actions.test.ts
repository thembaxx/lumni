import { beforeEach, describe, expect, mock, test } from "bun:test";

let mockUserId: string | null = "user_abc";

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
}));

mock.module("@/lib/server/auth", () => ({
	getAuthenticatedUserId: async () => mockUserId,
}));

let mockListDocumentsResults: Record<string, unknown[]> = {};

mock.module("@/lib/db/client", () => ({
	COLLECTIONS: {
		TOPICS: "topics",
		QUESTIONS: "questions",
	},
	listDocuments: mock(async (collection: string, _queries?: string[]) => {
		return mockListDocumentsResults[collection] || [];
	}),
}));

const { fetchQuestions } = await import("../quiz-actions");

beforeEach(() => {
	mockUserId = "user_abc";
	mockListDocumentsResults = {};
});

describe("fetchQuestions", () => {
	test("throws when user not authenticated", async () => {
		mockUserId = null;
		await expect(fetchQuestions(["math"])).rejects.toThrow(
			"Authentication required",
		);
	});

	test("returns empty array when no subjectIds provided", async () => {
		const result = await fetchQuestions([]);
		expect(result).toEqual([]);
	});

	test("returns empty array when no topics match subjectIds", async () => {
		mockListDocumentsResults["topics"] = [
			{ $id: "topic1", subjectId: "physics" },
		];
		const result = await fetchQuestions(["math"]);
		expect(result).toEqual([]);
	});

	test("returns questions filtered by matching topicIds", async () => {
		mockListDocumentsResults["topics"] = [
			{ $id: "topic1", subjectId: "math" },
			{ $id: "topic2", subjectId: "physics" },
		];
		mockListDocumentsResults["questions"] = [
			{ $id: "q1", topicId: "topic1", options: '{"a":"1","b":"2"}' },
			{ $id: "q2", topicId: "topic2", options: null },
			{ $id: "q3", topicId: "topic1", options: '{"c":"3"}' },
		];

		const result = await fetchQuestions(["math"]);

		expect(result).toHaveLength(2);
		expect(result[0].$id).toBe("q1");
		expect(result[0].options).toEqual({ a: "1", b: "2" });
		expect(result[1].$id).toBe("q3");
	});

	test("parses options JSON for each question", async () => {
		mockListDocumentsResults["topics"] = [{ $id: "topic1", subjectId: "math" }];
		mockListDocumentsResults["questions"] = [
			{ $id: "q1", topicId: "topic1", options: '{"key":"value"}' },
		];

		const result = await fetchQuestions(["math"]);

		expect(result[0].options).toEqual({ key: "value" });
	});

	test("handles a question with null options", async () => {
		mockListDocumentsResults["topics"] = [{ $id: "topic1", subjectId: "math" }];
		mockListDocumentsResults["questions"] = [
			{ $id: "q1", topicId: "topic1", options: null },
		];

		const result = await fetchQuestions(["math"]);

		expect(result[0].options).toBeNull();
	});
});
