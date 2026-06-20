import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockUserId } = vi.hoisted(() => ({
	mockUserId: { val: "user_abc" as string | null },
}));

const { mockVerifyAuthResolves } = vi.hoisted(() => ({
	mockVerifyAuthResolves: { val: true },
}));

vi.mock("@/lib/appwrite", () => ({
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

vi.mock("@/lib/server/auth", () => ({
	auth: async () => {
		if (!mockUserId.val) throw new Error("Authentication required");
		return mockUserId.val;
	},
	getAuthenticatedUserId: async () => mockUserId.val,
	verifyAuth: vi.fn(async (_userId: string) => {
		if (!mockVerifyAuthResolves.val) throw new Error("Authentication required");
	}),
	requireAdmin: async () => mockUserId.val,
	getAuthenticatedUserName: async () => "Test User",
}));

const {
	mockListDocumentsResults,
	mockCreateDocumentResult,
	mockDeleteDocumentCalls,
	mockUpdateDocumentCalls,
} = vi.hoisted(() => ({
	mockListDocumentsResults: {
		val: {} as Record<string, Record<string, unknown>[]>,
	},
	mockCreateDocumentResult: { val: "new-doc-id" },
	mockDeleteDocumentCalls: {
		val: [] as { collection: string; documentId: string }[],
	},
	mockUpdateDocumentCalls: {
		val: [] as {
			collection: string;
			documentId: string;
			data: Record<string, unknown>;
		}[],
	},
}));

vi.mock("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db-id",
	COLLECTIONS: {
		SUBJECTS: "subjects",
		USER_SUBJECTS: "user_subjects",
		USER_PROGRESS: "user_progress",
		STUDY_SESSIONS: "study_sessions",
		EXAM_PAPERS: "exam_papers",
	},
	createDocument: vi.fn(
		async (_collection: string, _data: Record<string, unknown>) =>
			mockCreateDocumentResult.val,
	),
	listDocuments: vi.fn(async (collection: string, _queries?: string[]) => {
		return mockListDocumentsResults.val[collection] || [];
	}),
	deleteDocument: vi.fn(async (collection: string, documentId: string) => {
		mockDeleteDocumentCalls.val.push({ collection, documentId });
	}),
	updateDocument: vi.fn(
		async (
			collection: string,
			documentId: string,
			data: Record<string, unknown>,
		) => {
			mockUpdateDocumentCalls.val.push({ collection, documentId, data });
		},
	),
}));

vi.mock("@/lib/appwrite.server", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {},
	serverAccount: {},
	serverClient: {},
}));

const { mockUploadFilesResult } = vi.hoisted(() => ({
	mockUploadFilesResult: { val: {} as Record<string, unknown> },
}));

vi.mock("uploadthing/server", () => ({
	UTApi: class {
		uploadFiles = vi.fn(() => mockUploadFilesResult.val);
	},
	UTFile: class {
		_data: Uint8Array[];
		_name: string;
		constructor(_data: Uint8Array[], _name: string) {
			this._data = _data;
			this._name = _name;
		}
	},
}));

vi.mock("node-appwrite", () => ({
	Users: class {
		async list() {
			return { users: [] };
		}
	},
}));

const { uuidCounter } = vi.hoisted(() => ({
	uuidCounter: { val: 0 },
}));

vi.mock("node:crypto", async () => ({
	default: { randomUUID: () => `uuid-${++uuidCounter.val}` },
	randomUUID: () => `uuid-${++uuidCounter.val}`,
}));

const {
	fetchSubjects,
	fetchUserProgress,
	toggleUserSubject,
	adminUploadExamPaper,
	getUserAccounts,
} = await import("../actions");

beforeEach(() => {
	mockUserId.val = "user_abc";
	mockVerifyAuthResolves.val = true;
	mockListDocumentsResults.val = {};
	mockCreateDocumentResult.val = "new-doc-id";
	mockDeleteDocumentCalls.val = [];
	mockUpdateDocumentCalls.val = [];
	mockUploadFilesResult.val = {};
	uuidCounter.val = 0;
});

describe("fetchSubjects", () => {
	test("returns subjects and selected subject IDs", async () => {
		mockListDocumentsResults.val.subjects = [
			{ $id: "s1", name: "Mathematics", code: "math" },
			{ $id: "s2", name: "Physics", code: "physics" },
		];
		mockListDocumentsResults.val.user_subjects = [
			{ $id: "us1", userId: "user_abc", subjectId: "s1" },
		];

		const result = await fetchSubjects("user_abc");

		expect(result.subjects).toHaveLength(2);
		expect(result.selectedSubjectIds).toEqual(["s1"]);
	});
});

describe("fetchUserProgress", () => {
	test("returns aggregated progress from sessions", async () => {
		mockListDocumentsResults.val.user_progress = [{ currentStreak: 3 }];
		mockListDocumentsResults.val.study_sessions = [
			{ questionsAnswered: 10, correctCount: 7 },
			{ questionsAnswered: 5, correctCount: 3 },
		];

		const result = await fetchUserProgress("user_abc");

		expect(result.questionsAnswered).toBe(15);
		expect(result.accuracy).toBe(67);
		expect(result.streak).toBe(3);
	});

	test("handles empty progress and sessions", async () => {
		mockListDocumentsResults.val.user_progress = [];
		mockListDocumentsResults.val.study_sessions = [];

		const result = await fetchUserProgress("user_abc");

		expect(result.questionsAnswered).toBe(0);
		expect(result.accuracy).toBe(0);
		expect(result.streak).toBe(0);
	});

	test("handles null progress with existing sessions", async () => {
		mockListDocumentsResults.val.user_progress = [];
		mockListDocumentsResults.val.study_sessions = [
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
		mockListDocumentsResults.val.user_subjects = [
			{ $id: "us1", userId: "user_abc", subjectId: "s1" },
		];

		const result = await toggleUserSubject("user_abc", "s1");

		expect(result).toBe(false);
		expect(mockDeleteDocumentCalls.val).toHaveLength(1);
		expect(mockDeleteDocumentCalls.val[0].documentId).toBe("us1");
	});

	test("creates new user subject and returns true", async () => {
		mockListDocumentsResults.val.user_subjects = [];

		const result = await toggleUserSubject("user_abc", "s1");

		expect(result).toBe(true);
	});
});

describe("adminUploadExamPaper", () => {
	test("returns auth error when not authenticated", async () => {
		mockUserId.val = null;
		const formData = new FormData();
		formData.set("file", new File([""], "test.pdf", { type: "application/pdf" }));
		formData.set("subjectId", "sub1");
		formData.set("year", "2024");
		formData.set("paperNumber", "1");
		formData.set("type", "paper");
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

		mockUploadFilesResult.val = {
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

		mockUploadFilesResult.val = {
			data: {
				ufsUrl: "https://utfs.io/f/memo.pdf",
				key: "memo-key",
				url: "https://utfs.io/f/memo.pdf",
			},
		};
		mockListDocumentsResults.val.exam_papers = [
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
		expect(mockUpdateDocumentCalls.val).toHaveLength(1);
		expect(mockUpdateDocumentCalls.val[0].documentId).toBe("paper1");
		expect(mockUpdateDocumentCalls.val[0].data).toEqual({ memoId: "uuid-1" });
	});

	test("handles upload failure gracefully", async () => {
		const formData = new FormData();
		const blob = new Blob(["pdf content"], { type: "application/pdf" });
		formData.append("file", blob, "exam.pdf");
		formData.append("subjectId", "math");
		formData.append("year", "2024");
		formData.append("paperNumber", "1");
		formData.append("type", "paper");

		mockUploadFilesResult.val = {
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
