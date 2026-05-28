import { beforeEach, describe, expect, mock, test } from "bun:test";

let mockUserId: string | null = "user_abc";
let mockVerifyAuthResolves = true;

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {},
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
	serverAccount: {},
	serverClient: {},
}));

mock.module("@/lib/server/auth", () => ({
	auth: async () => {
		if (!mockUserId) throw new Error("Authentication required");
		return mockUserId;
	},
	getAuthenticatedUserId: async () => mockUserId,
	verifyAuth: mock(async (_userId: string) => {
		if (!mockVerifyAuthResolves) throw new Error("Authentication required");
	}),
	requireAdmin: async () => mockUserId,
	getAuthenticatedUserName: async () => "Test User",
}));

let mockListDocumentsResults: Record<string, Record<string, unknown>[]> = {};
let mockCreateDocumentResult = "new-doc-id";
let mockDeleteDocumentCalls: { collection: string; documentId: string }[] = [];
let mockUpdateDocumentCalls: {
	collection: string;
	documentId: string;
	data: Record<string, unknown>;
}[] = [];

mock.module("@/lib/db/client", () => ({
	COLLECTIONS: {
		SUBJECTS: "subjects",
		USER_SUBJECTS: "user_subjects",
		USER_PROGRESS: "user_progress",
		STUDY_SESSIONS: "study_sessions",
		EXAM_PAPERS: "exam_papers",
	},
	createDocument: mock(
		async (_collection: string, _data: Record<string, unknown>) =>
			mockCreateDocumentResult,
	),
	listDocuments: mock(async (collection: string, _queries?: string[]) => {
		return mockListDocumentsResults[collection] || [];
	}),
	deleteDocument: mock(async (collection: string, documentId: string) => {
		mockDeleteDocumentCalls.push({ collection, documentId });
	}),
	updateDocument: mock(
		async (
			collection: string,
			documentId: string,
			data: Record<string, unknown>,
		) => {
			mockUpdateDocumentCalls.push({ collection, documentId, data });
		},
	),
}));

let mockUploadFilesResult: Record<string, unknown> = {};

mock.module("uploadthing/server", () => ({
	UTApi: mock(() => ({
		uploadFiles: mock(() => mockUploadFilesResult),
	})),
	UTFile: mock((_data: Uint8Array[], _name: string) => ({})),
}));

let uuidCounter = 0;
mock.module("crypto", () => ({
	randomUUID: () => `uuid-${++uuidCounter}`,
}));

const {
	fetchSubjects,
	fetchUserProgress,
	toggleUserSubject,
	adminUploadExamPaper,
	getUserAccounts,
} = await import("../actions");

beforeEach(() => {
	mockUserId = "user_abc";
	mockVerifyAuthResolves = true;
	mockListDocumentsResults = {};
	mockCreateDocumentResult = "new-doc-id";
	mockDeleteDocumentCalls = [];
	mockUpdateDocumentCalls = [];
	mockUploadFilesResult = {};
	uuidCounter = 0;
});

describe("fetchSubjects", () => {
	test("returns subjects and selected subject IDs", async () => {
		mockListDocumentsResults.subjects = [
			{ $id: "s1", name: "Mathematics", code: "math" },
			{ $id: "s2", name: "Physics", code: "physics" },
		];
		mockListDocumentsResults.user_subjects = [
			{ $id: "us1", userId: "user_abc", subjectId: "s1" },
		];

		const result = await fetchSubjects("user_abc");

		expect(result.subjects).toHaveLength(2);
		expect(result.selectedSubjectIds).toEqual(["s1"]);
	});
});

describe("fetchUserProgress", () => {
	test("returns aggregated progress from sessions", async () => {
		mockListDocumentsResults.user_progress = [{ currentStreak: 3 }];
		mockListDocumentsResults.study_sessions = [
			{ questionsAnswered: 10, correctCount: 7 },
			{ questionsAnswered: 5, correctCount: 3 },
		];

		const result = await fetchUserProgress("user_abc");

		expect(result.questionsAnswered).toBe(15);
		expect(result.accuracy).toBe(67);
		expect(result.streak).toBe(3);
	});

	test("handles empty progress and sessions", async () => {
		mockListDocumentsResults.user_progress = [];
		mockListDocumentsResults.study_sessions = [];

		const result = await fetchUserProgress("user_abc");

		expect(result.questionsAnswered).toBe(0);
		expect(result.accuracy).toBe(0);
		expect(result.streak).toBe(0);
	});

	test("handles null progress with existing sessions", async () => {
		mockListDocumentsResults.user_progress = [];
		mockListDocumentsResults.study_sessions = [
			{ questionsAnswered: 20, correctCount: 15 },
		];

		const result = await fetchUserProgress("user_abc");

		expect(result.questionsAnswered).toBe(20);
		expect(result.accuracy).toBe(75);
		expect(result.streak).toBe(0);
	});
});

describe("toggleUserSubject", () => {
	test("deletes existing user subject and returns false", async () => {
		mockListDocumentsResults.user_subjects = [
			{ $id: "us1", userId: "user_abc", subjectId: "s1" },
		];

		const result = await toggleUserSubject("user_abc", "s1");

		expect(result).toBe(false);
		expect(mockDeleteDocumentCalls).toHaveLength(1);
		expect(mockDeleteDocumentCalls[0].documentId).toBe("us1");
	});

	test("creates new user subject and returns true", async () => {
		mockListDocumentsResults.user_subjects = [];

		const result = await toggleUserSubject("user_abc", "s1");

		expect(result).toBe(true);
	});
});

describe("adminUploadExamPaper", () => {
	test("returns auth error when not authenticated", async () => {
		mockUserId = null;
		const formData = new FormData();
		await expect(adminUploadExamPaper(formData)).rejects.toThrow(
			"Authentication required",
		);
	});

	test("returns error when required fields missing", async () => {
		const formData = new FormData();

		const result = await adminUploadExamPaper(formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Missing required fields");
	});

	test("uploads file and creates document successfully", async () => {
		const formData = new FormData();
		const blob = new Blob(["pdf content"], { type: "application/pdf" });
		formData.append("file", blob, "exam.pdf");
		formData.append("subjectId", "math");
		formData.append("year", "2024");
		formData.append("paperNumber", "1");
		formData.append("type", "paper");

		mockUploadFilesResult = {
			data: {
				ufsUrl: "https://utfs.io/f/exam.pdf",
				key: "file-key",
				url: "https://utfs.io/f/exam.pdf",
			},
		};

		const result = await adminUploadExamPaper(formData);

		expect(result.success).toBe(true);
		expect(result.url).toBe("https://utfs.io/f/exam.pdf");
	});

	test("links memo to existing paper", async () => {
		const formData = new FormData();
		const blob = new Blob(["memo content"], { type: "application/pdf" });
		formData.append("file", blob, "memo.pdf");
		formData.append("subjectId", "math");
		formData.append("year", "2024");
		formData.append("paperNumber", "1");
		formData.append("type", "memo");

		mockUploadFilesResult = {
			data: {
				ufsUrl: "https://utfs.io/f/memo.pdf",
				key: "memo-key",
				url: "https://utfs.io/f/memo.pdf",
			},
		};
		mockListDocumentsResults.exam_papers = [
			{
				$id: "paper1",
				subjectId: "math",
				year: 2024,
				paperNumber: 1,
				type: "paper",
			},
		];

		const result = await adminUploadExamPaper(formData);

		expect(result.success).toBe(true);
		expect(mockUpdateDocumentCalls).toHaveLength(1);
		expect(mockUpdateDocumentCalls[0].documentId).toBe("paper1");
		expect(mockUpdateDocumentCalls[0].data).toEqual({ memoId: "uuid-1" });
	});

	test("handles upload failure gracefully", async () => {
		const formData = new FormData();
		const blob = new Blob(["pdf content"], { type: "application/pdf" });
		formData.append("file", blob, "exam.pdf");
		formData.append("subjectId", "math");
		formData.append("year", "2024");
		formData.append("paperNumber", "1");
		formData.append("type", "paper");

		mockUploadFilesResult = {
			error: { message: "Upload failed" },
		};

		const result = await adminUploadExamPaper(formData);

		expect(result.success).toBe(false);
		expect(result.error).toBe("Upload failed");
	});
});

describe("getUserAccounts", () => {
	test("returns empty array", async () => {
		const result = await getUserAccounts("any_user");
		expect(result).toEqual([]);
	});
});
