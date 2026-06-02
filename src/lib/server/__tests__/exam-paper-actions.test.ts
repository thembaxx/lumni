import { beforeEach, describe, expect, mock, test } from "bun:test";

let mockUserId: string | null = "user_abc";

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
	verifyAuth: async () => {},
	getAuthenticatedUserId: async () => mockUserId,
	requireAdmin: async () => mockUserId,
	getAuthenticatedUserName: async () => "Test User",
}));

let mockExecQueue: { columns: string[]; values: unknown[][] }[] = [];
let mockRunCalls: { sql: string; args: unknown[] }[] = [];

const mockDb = {
	exec: mock((_sql: string, _args?: unknown[]) => {
		const result = mockExecQueue.shift();
		return result ? [result] : [];
	}),
	run: mock((sql: string, args?: unknown[]) => {
		mockRunCalls.push({ sql, args: args || [] });
	}),
};

let mockAllExamPapers: Record<string, unknown>[] = [];
let mockExamPapersBySubject: Record<string, unknown>[] = [];
let mockExamPaperCount = 0;

mock.module("@/lib/db/exams", () => ({
	getExamsDb: async () => mockDb,
	getExamPaperCount: mock(() => mockExamPaperCount),
	getAllExamPapers: mock(() => mockAllExamPapers),
	getExamPapersBySubject: mock(
		(_subjectCode: string, _year?: number) => mockExamPapersBySubject,
	),
	insertExamPaper: mock(() => {}),
	saveExamsDb: mock(() => {}),
}));

mock.module("@/lib/db/exams/schema", () => ({
	parseExamPaperFilename: mock((_filename: string) => ({
		subjectCode: "mathematics",
		subjectName: "Mathematics",
		year: 2024,
		paperNumber: 1,
		type: "paper" as const,
		originalFileName: _filename,
	})),
}));

let mockUploadResult: Record<string, unknown> = {};
let mockDeleteResult: Record<string, unknown> = {};

mock.module("uploadthing/server", () => ({
	UTApi: mock(() => ({
		uploadFiles: mock(() => mockUploadResult),
		deleteFiles: mock(() => mockDeleteResult),
	})),
	UTFile: mock((_data: Uint8Array[], _name: string) => ({})),
}));

let uuidCounter = 0;
mock.module("crypto", () => ({
	randomUUID: () => `uuid-${++uuidCounter}`,
}));

const { uploadExamPaper, deleteExamPaper, getExamPapersWithFallback } =
	await import("../exam-paper-actions");
const { checkAndPopulateExamsDb } = await import("../exam-papers-db");

beforeEach(() => {
	mockUserId = "user_abc";
	uuidCounter = 0;
	mockExecQueue = [];
	mockRunCalls = [];
	mockAllExamPapers = [];
	mockExamPapersBySubject = [];
	mockExamPaperCount = 0;
	mockUploadResult = {};
	mockDeleteResult = {};
});

describe("uploadExamPaper", () => {
	test("throws when user not authenticated", async () => {
		mockUserId = null;
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
		mockExecQueue = [{ columns: ["id"], values: [["existing-id"]] }];
		mockUploadResult = {
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
		mockExecQueue = [
			{ columns: ["id"], values: [] },
			{
				columns: [
					"id",
					"subject_code",
					"subject_name",
					"year",
					"paper_number",
					"type",
					"memo_id",
					"file_url",
					"file_key",
					"original_file_name",
					"uploaded_at",
				],
				values: [
					[
						"uuid-1",
						"mathematics",
						"Mathematics",
						2024,
						1,
						"paper",
						null,
						"https://utfs.io/f/file.pdf",
						"file-key",
						"exam.pdf",
						"2025-01-01T00:00:00Z",
					],
				],
			},
		];
		mockUploadResult = {
			data: {
				ufsUrl: "https://utfs.io/f/file.pdf",
				key: "file-key",
				url: "https://utfs.io/f/file.pdf",
			},
		};

		const result = await uploadExamPaper({
			fileContent: Buffer.from("pdf data"),
			subjectCode: "mathematics",
			year: 2024,
			paperNumber: 1,
			type: "paper",
			originalFileName: "exam.pdf",
		});

		expect(result.id).toBe("uuid-1");
		expect(result.subjectCode).toBe("mathematics");
		expect(result.fileUrl).toBe("https://utfs.io/f/file.pdf");
	});

	test("links memo to paper when uploading memo", async () => {
		mockExecQueue = [
			{ columns: ["id"], values: [] },
			{
				columns: ["id"],
				values: [["paper-id-1"]],
			},
			{
				columns: [
					"id",
					"subject_code",
					"subject_name",
					"year",
					"paper_number",
					"type",
					"memo_id",
					"file_url",
					"file_key",
					"original_file_name",
					"uploaded_at",
				],
				values: [
					[
						"uuid-1",
						"mathematics",
						"Mathematics",
						2024,
						1,
						"memo",
						"paper-id-1",
						"https://utfs.io/f/memo.pdf",
						"memo-key",
						"memo.pdf",
						"2025-01-01T00:00:00Z",
					],
				],
			},
		];
		mockUploadResult = {
			data: {
				ufsUrl: "https://utfs.io/f/memo.pdf",
				key: "memo-key",
				url: "https://utfs.io/f/memo.pdf",
			},
		};

		const result = await uploadExamPaper({
			fileContent: Buffer.from("memo data"),
			subjectCode: "mathematics",
			year: 2024,
			paperNumber: 1,
			type: "memo",
		});

		expect(result.type).toBe("memo");
	});

	test("derives subjectCode from filename when not provided", async () => {
		mockExecQueue = [
			{ columns: ["id"], values: [] },
			{
				columns: [
					"id",
					"subject_code",
					"subject_name",
					"year",
					"paper_number",
					"type",
					"memo_id",
					"file_url",
					"file_key",
					"original_file_name",
					"uploaded_at",
				],
				values: [
					[
						"uuid-1",
						"mathematics",
						"Mathematics",
						2024,
						1,
						"paper",
						null,
						"https://utfs.io/f/file.pdf",
						"file-key",
						"exam.pdf",
						"2025-01-01T00:00:00Z",
					],
				],
			},
		];
		mockUploadResult = {
			data: {
				ufsUrl: "https://utfs.io/f/file.pdf",
				key: "file-key",
				url: "https://utfs.io/f/file.pdf",
			},
		};

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
		mockUserId = null;
		await expect(deleteExamPaper("p1")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("throws when exam paper not found", async () => {
		mockExecQueue = [];
		await expect(deleteExamPaper("nonexistent")).rejects.toThrow(
			"Exam paper not found",
		);
	});

	test("deletes exam paper successfully", async () => {
		mockExecQueue = [{ columns: ["file_key"], values: [["file-key-123"]] }];
		mockDeleteResult = {};

		await deleteExamPaper("p1");

		expect(mockDb.run).toHaveBeenCalled();
	});
});

describe("getExamPapersWithFallback", () => {
	test("returns mapped records when db has data", async () => {
		mockAllExamPapers = [
			{
				id: "p1",
				subject_code: "math",
				subject_name: "Mathematics",
				year: 2024,
				paper_number: 1,
				type: "paper",
				file_url: "url",
				file_key: "key",
				original_file_name: "file.pdf",
				uploaded_at: "now",
			},
		];

		const result = await getExamPapersWithFallback();
		expect(result).toHaveLength(1);
		expect(result?.[0].session).toBe("november");
	});

	test("uses may-june session for papers 3+", async () => {
		mockAllExamPapers = [
			{
				id: "p1",
				subject_code: "math",
				subject_name: "Mathematics",
				year: 2024,
				paper_number: 3,
				type: "paper",
				file_url: "url",
				file_key: "key",
				original_file_name: "file.pdf",
				uploaded_at: "now",
			},
		];

		const result = await getExamPapersWithFallback();
		expect(result?.[0].session).toBe("may-june");
	});

	test("returns null when db has no data", async () => {
		mockAllExamPapers = [];
		const result = await getExamPapersWithFallback();
		expect(result).toBeNull();
	});
});

describe("checkAndPopulateExamsDb", () => {
	test("returns not populated when count > 0", async () => {
		mockExamPaperCount = 5;
		const result = await checkAndPopulateExamsDb();
		expect(result.populated).toBe(false);
		expect(result.count).toBe(5);
	});
});
