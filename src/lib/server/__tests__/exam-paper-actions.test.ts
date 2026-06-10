import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockUserId } = vi.hoisted(() => ({
	mockUserId: { val: "user_abc" as string | null },
}));

const {
	mockListDocuments,
	mockGetDocument,
	mockCreateDocument,
	mockUpdateDocument,
	mockDeleteDocument,
} = vi.hoisted(() => ({
	mockListDocuments: vi.fn(
		async (_dbId: string, _collection: string, _queries?: string[]) => ({
			documents: [],
			total: 0,
		}),
	),
	mockGetDocument: vi.fn(
		async (_dbId: string, _collection: string, _docId: string) => null,
	),
	mockCreateDocument: vi.fn(
		async (
			_dbId: string,
			_collection: string,
			_docId: string,
			_data: unknown,
		) => ({ $id: "new-id" }) as unknown,
	),
	mockUpdateDocument: vi.fn(
		async (
			_dbId: string,
			_collection: string,
			_docId: string,
			_data: unknown,
		) => null,
	),
	mockDeleteDocument: vi.fn(
		async (_dbId: string, _collection: string, _docId: string) => null,
	),
}));

vi.mock("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
	client: {},
}));

vi.mock("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db-id",
	COLLECTIONS: {
		EXAM_PAPERS: "exam_papers",
	},
}));

vi.mock("@/lib/appwrite.server", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		listDocuments: mockListDocuments,
		getDocument: mockGetDocument,
		createDocument: mockCreateDocument,
		updateDocument: mockUpdateDocument,
		deleteDocument: mockDeleteDocument,
	},
	serverAccount: {},
	serverClient: {},
}));

vi.mock("@/lib/server/auth", () => ({
	auth: async () => {
		if (!mockUserId.val) throw new Error("Authentication required");
		return mockUserId.val;
	},
	verifyAuth: async () => {},
	getAuthenticatedUserId: async () => mockUserId.val,
	requireAdmin: async () => mockUserId.val,
	getAuthenticatedUserName: async () => "Test User",
}));

const { mockUploadResult, mockDeleteResult } = vi.hoisted(() => ({
	mockUploadResult: { val: {} as Record<string, unknown> },
	mockDeleteResult: { val: {} as Record<string, unknown> },
}));

vi.mock("uploadthing/server", () => ({
	UTApi: class {
		uploadFiles = vi.fn(() => mockUploadResult.val);
		deleteFiles = vi.fn(() => mockDeleteResult.val);
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

const { uuidCounter } = vi.hoisted(() => ({
	uuidCounter: { val: 0 },
}));

vi.mock("node:crypto", async () => ({
	default: { randomUUID: () => `uuid-${++uuidCounter.val}` },
	randomUUID: () => `uuid-${++uuidCounter.val}`,
}));

vi.mock("@/lib/exams/helpers", () => ({
	parseExamPaperFilename: vi.fn((_filename: string) => ({
		subjectCode: "mathematics",
		subjectName: "Mathematics",
		year: 2024,
		paperNumber: 1,
		type: "paper" as const,
		originalFileName: _filename,
	})),
}));

const { uploadExamPaper, deleteExamPaper, getExamPapersWithFallback } =
	await import("../exam-paper-actions");

beforeEach(() => {
	mockUserId.val = "user_abc";
	uuidCounter.val = 0;
	mockUploadResult.val = {};
	mockDeleteResult.val = {};
	mockListDocuments.mockReset();
	mockGetDocument.mockReset();
	mockCreateDocument.mockReset();
	mockUpdateDocument.mockReset();
	mockDeleteDocument.mockReset();

	mockListDocuments.mockResolvedValue({ documents: [], total: 0 });
});

describe("uploadExamPaper", () => {
	test("throws when user not authenticated", async () => {
		mockUserId.val = null;
		await expect(
			uploadExamPaper({ year: 2024, paperNumber: 1, type: "paper" }),
		).rejects.toThrow("Authentication required");
	});

	test("throws when neither fileContent nor filePath provided", async () => {
		await expect(
			uploadExamPaper({ year: 2024, paperNumber: 1, type: "paper" }),
		).rejects.toThrow("Either filePath or fileContent must be provided");
	});

	test("throws when exam paper already exists", async () => {
		mockListDocuments.mockResolvedValue({
			documents: [{ $id: "existing-id" }],
			total: 1,
		});
		mockUploadResult.val = {
			data: {
				ufsUrl: "https://utfs.io/f/file.pdf",
				key: "file-key",
				url: "https://utfs.io/f/file.pdf",
			},
		};

		await expect(
			uploadExamPaper({
				fileContent: Buffer.from("pdf data"),
				subjectCode: "mathematics",
				year: 2024,
				paperNumber: 1,
				type: "paper",
			}),
		).rejects.toThrow("Exam paper already exists");
	});

	test("uploads file and creates record successfully", async () => {
		mockUploadResult.val = {
			data: {
				ufsUrl: "https://utfs.io/f/file.pdf",
				key: "file-key",
				url: "https://utfs.io/f/file.pdf",
			},
		};

		mockGetDocument.mockResolvedValue({
			$id: "uuid-1",
			subject: "Mathematics",
			subjectCode: "mathematics",
			subjectName: "Mathematics",
			paperCode: "mathematics-p1",
			paperNumber: 1,
			examPeriod: "november",
			year: 2024,
			grade: 12,
			language: "english",
			totalMarks: 150,
			duration: "3 hours",
			type: "paper",
			memoId: null,
			fileKeys: '["file-key"]',
			fileUrl: "https://utfs.io/f/file.pdf",
			originalFileName: "exam.pdf",
			uploadedAt: "2025-01-01T00:00:00Z",
			uploadedBy: "user_abc",
		});

		const result = await uploadExamPaper({
			fileContent: Buffer.from("pdf data"),
			subjectCode: "mathematics",
			year: 2024,
			paperNumber: 1,
			type: "paper",
			originalFileName: "exam.pdf",
		});

		expect(result.$id).toBe("uuid-1");
		expect(result.subjectCode).toBe("mathematics");
		expect(result.fileUrl).toBe("https://utfs.io/f/file.pdf");
	});

	test("links memo to paper when uploading memo", async () => {
		mockListDocuments.mockResolvedValueOnce({
			documents: [],
			total: 0,
		});

		mockListDocuments.mockResolvedValueOnce({
			documents: [{ $id: "paper-id-1" }],
			total: 1,
		});

		mockUploadResult.val = {
			data: {
				ufsUrl: "https://utfs.io/f/memo.pdf",
				key: "memo-key",
				url: "https://utfs.io/f/memo.pdf",
			},
		};

		mockGetDocument.mockResolvedValue({
			$id: "uuid-1",
			subject: "Mathematics",
			subjectCode: "mathematics",
			subjectName: "Mathematics",
			paperCode: "mathematics-p1",
			paperNumber: 1,
			examPeriod: "november",
			year: 2024,
			grade: 12,
			language: "english",
			totalMarks: 150,
			duration: "3 hours",
			type: "memo",
			memoId: "paper-id-1",
			fileKeys: '["memo-key"]',
			fileUrl: "https://utfs.io/f/memo.pdf",
			originalFileName: "memo.pdf",
			uploadedAt: "2025-01-01T00:00:00Z",
			uploadedBy: "user_abc",
		});

		const result = await uploadExamPaper({
			fileContent: Buffer.from("memo data"),
			subjectCode: "mathematics",
			year: 2024,
			paperNumber: 1,
			type: "memo",
		});

		expect(result.$id).toBe("uuid-1");
		expect(result.type).toBe("memo");
	});

	test("derives subjectCode from filename when not provided", async () => {
		mockUploadResult.val = {
			data: {
				ufsUrl: "https://utfs.io/f/file.pdf",
				key: "file-key",
				url: "https://utfs.io/f/file.pdf",
			},
		};

		mockGetDocument.mockResolvedValue({
			$id: "uuid-1",
			subject: "Mathematics",
			subjectCode: "mathematics",
			subjectName: "Mathematics",
			paperCode: "mathematics-p1",
			paperNumber: 1,
			examPeriod: "november",
			year: 2024,
			grade: 12,
			language: "english",
			totalMarks: 150,
			duration: "3 hours",
			type: "paper",
			memoId: null,
			fileKeys: '["file-key"]',
			fileUrl: "https://utfs.io/f/file.pdf",
			originalFileName: "2024_mathematics_p1.pdf",
			uploadedAt: "2025-01-01T00:00:00Z",
			uploadedBy: "user_abc",
		});

		const result = await uploadExamPaper({
			fileContent: Buffer.from("pdf data"),
			year: 2024,
			paperNumber: 1,
			type: "paper",
			originalFileName: "2024_mathematics_p1.pdf",
		});

		expect(result.subjectCode).toBe("mathematics");
	});
});

describe("deleteExamPaper", () => {
	test("throws when not authenticated", async () => {
		mockUserId.val = null;
		await expect(deleteExamPaper("p1")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("throws when exam paper not found", async () => {
		mockGetDocument.mockRejectedValue(new Error("Document not found"));
		await expect(deleteExamPaper("nonexistent")).rejects.toThrow(
			"Document not found",
		);
	});

	test("deletes exam paper successfully", async () => {
		mockGetDocument.mockResolvedValue({
			$id: "p1",
			fileKeys: '["file-key-123"]',
		});
		mockDeleteResult.val = {};

		await deleteExamPaper("p1");

		expect(mockDeleteDocument).toHaveBeenCalled();
	});
});

describe("getExamPapersWithFallback", () => {
	test("returns mapped records when appwrite has data", async () => {
		mockListDocuments.mockResolvedValue({
			documents: [
				{
					$id: "p1",
					subject: "Mathematics",
					subjectCode: "math",
					subjectName: "Mathematics",
					paperCode: "math-p1",
					paperNumber: 1,
					examPeriod: "november",
					year: 2024,
					grade: 12,
					language: "english",
					totalMarks: 150,
					duration: "3 hours",
					type: "paper",
					memoId: null,
					fileKeys: '["key"]',
					fileUrl: "url",
					originalFileName: "file.pdf",
					uploadedAt: "now",
					uploadedBy: "user",
				},
			],
			total: 1,
		});

		const result = await getExamPapersWithFallback();
		expect(result).toHaveLength(1);
		expect(result?.[0].session).toBe("november");
	});

	test("uses may-june session for papers 3+", async () => {
		mockListDocuments.mockResolvedValue({
			documents: [
				{
					$id: "p1",
					subject: "Mathematics",
					subjectCode: "math",
					subjectName: "Mathematics",
					paperCode: "math-p3",
					paperNumber: 3,
					examPeriod: "may-june",
					year: 2024,
					grade: 12,
					language: "english",
					totalMarks: 150,
					duration: "3 hours",
					type: "paper",
					memoId: null,
					fileKeys: '["key"]',
					fileUrl: "url",
					originalFileName: "file.pdf",
					uploadedAt: "now",
					uploadedBy: "user",
				},
			],
			total: 1,
		});

		const result = await getExamPapersWithFallback();
		expect(result?.[0].session).toBe("may-june");
	});

	test("returns null when appwrite has no data", async () => {
		mockListDocuments.mockResolvedValue({ documents: [], total: 0 });
		const result = await getExamPapersWithFallback();
		expect(result).toBeNull();
	});
});
