import { beforeEach, describe, expect, test, vi } from "vitest";

const { mockUploadFiles } = vi.hoisted(() => ({
	mockUploadFiles: vi.fn(
		async (): Promise<{
			data: { ufsUrl: string; key: string };
			error: null;
		}> => ({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		}),
	),
}));

const { mockExistsSync, mockReadFileSync, mockReaddirSync, mockWriteFileSync } =
	vi.hoisted(() => ({
		mockExistsSync: vi.fn((_path: string) => false),
		mockReadFileSync: vi.fn((_path: string) => Buffer.from("fake-pdf")),
		mockReaddirSync: vi.fn((_path: string) => [] as string[]),
		mockWriteFileSync: vi.fn((_path: string, _data: string) => {}),
	}));

vi.mock("node:fs", () => ({
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
	readdirSync: mockReaddirSync,
	writeFileSync: mockWriteFileSync,
	default: {
		existsSync: mockExistsSync,
		readFileSync: mockReadFileSync,
		readdirSync: mockReaddirSync,
		writeFileSync: mockWriteFileSync,
	},
}));

vi.mock("path", () => ({
	join: vi.fn((...parts: string[]) => parts.join("/")),
	default: { join: vi.fn((...parts: string[]) => parts.join("/")) },
}));

vi.mock("uploadthing/server", () => ({
	UTApi: class {
		uploadFiles = mockUploadFiles;
	},
	UTFile: class {
		bytes: Uint8Array[];
		name: string;
		constructor(bytes: Uint8Array[], name: string) {
			this.bytes = bytes;
			this.name = name;
		}
	},
}));

const {
	mockListDocuments,
	mockGetDocument,
	mockCreateDocument,
	mockUpdateDocument,
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
}));

vi.mock("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
}));

vi.mock("@/lib/server/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		listDocuments: mockListDocuments,
		getDocument: mockGetDocument,
		createDocument: mockCreateDocument,
	},
	serverAccount: {},
	serverClient: {},
}));

vi.mock("@/lib/exams/helpers", () => ({
	parseExamPaperFilename: vi.fn((_filename: string) => null),
}));

vi.mock("@/lib/subjects", async (importOriginal) => {
	const real = await importOriginal<typeof import("@/lib/subjects")>();
	return {
		...real,
		getSubjectAbbr: vi.fn(real.getSubjectAbbr),
		getSubjectName: vi.fn(real.getSubjectName),
	};
});

const {
	ensureExamPapersSynced,
	isSyncCompleted,
	syncExamPapers,
	forceSyncExamPapers,
} = await import("../sync-exam-papers");

describe("isSyncCompleted", () => {
	test("returns false initially", () => {
		expect(isSyncCompleted()).toBe(false);
	});
});

describe("ensureExamPapersSynced", () => {
	beforeEach(() => {
		mockExistsSync.mockReset();
		mockReaddirSync.mockReset();
		mockWriteFileSync.mockReset();
		mockUploadFiles.mockReset();
		mockListDocuments.mockReset();
		mockCreateDocument.mockReset();
		mockUpdateDocument.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		});
	});

	test("sets syncCompleted when exam papers already exist in Appwrite", async () => {
		mockListDocuments.mockResolvedValue({
			documents: [{ $id: "existing" }],
			total: 1,
		});
		await ensureExamPapersSynced();
		expect(isSyncCompleted()).toBe(true);
	});

	test("does not call internal sync when syncCompleted", async () => {
		mockListDocuments.mockResolvedValue({
			documents: [{ $id: "existing" }],
			total: 1,
		});
		await ensureExamPapersSynced();
		const countBefore = mockListDocuments.mock.calls.length;
		await ensureExamPapersSynced();
		expect(mockListDocuments.mock.calls.length).toBe(countBefore);
	});

	test("scans local PDFs when no papers in Appwrite", async () => {
		mockListDocuments.mockResolvedValue({ documents: [], total: 0 });
		mockReaddirSync.mockReturnValue(["2024_mathematics_p1.pdf"]);
		mockExistsSync.mockReturnValue(false);
		const result = await syncExamPapers();
		expect(result).toMatchObject({ uploaded: 0, errors: [] });
	});
});

describe("syncExamPapers", () => {
	beforeEach(() => {
		mockReaddirSync.mockReset();
		mockExistsSync.mockReset();
		mockUploadFiles.mockReset();
		mockListDocuments.mockReset();
		mockCreateDocument.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		});
	});

	test("returns result with zero counts when no PDFs exist", async () => {
		mockExistsSync.mockReturnValue(false);
		mockReaddirSync.mockReturnValue([]);
		const result = await syncExamPapers();
		expect(result).toEqual({ uploaded: 0, skipped: 0, errors: [] });
	});
});

describe("forceSyncExamPapers", () => {
	beforeEach(() => {
		mockReaddirSync.mockReset();
		mockExistsSync.mockReset();
		mockUploadFiles.mockReset();
		mockListDocuments.mockReset();
		mockCreateDocument.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		});
	});

	test("forces re-upload when force=true", async () => {
		mockExistsSync.mockReturnValue(false);
		mockReaddirSync.mockReturnValue([]);
		const result = await forceSyncExamPapers();
		expect(result).toMatchObject({ uploaded: 0, skipped: 0, errors: [] });
	});
});
