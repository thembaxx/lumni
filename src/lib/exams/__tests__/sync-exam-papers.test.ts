import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockUploadFiles = mock(
	async (): Promise<{
		data: { ufsUrl: string; key: string };
		error: null;
	}> => ({
		data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
		error: null,
	}),
);

const mockExistsSync = mock((_path: string) => false);
const mockReadFileSync = mock((_path: string) => Buffer.from("fake-pdf"));
const mockReaddirSync = mock((_path: string) => [] as string[]);
const mockWriteFileSync = mock((_path: string, _data: string) => {});

mock.module("node:fs", () => ({
	existsSync: mockExistsSync,
	readFileSync: mockReadFileSync,
	readdirSync: mockReaddirSync,
	writeFileSync: mockWriteFileSync,
}));

mock.module("path", () => ({
	join: mock((...parts: string[]) => parts.join("/")),
	default: { join: mock((...parts: string[]) => parts.join("/")) },
}));

mock.module("uploadthing/server", () => ({
	UTApi: mock(() => ({
		uploadFiles: mockUploadFiles,
	})),
	UTFile: mock((bytes: Uint8Array[], name: string) => ({ bytes, name })),
}));

const mockListDocuments = mock(
	async (_dbId: string, _collection: string, _queries?: string[]) => ({
		documents: [],
		total: 0,
	}),
);
const mockCreateDocument = mock(
	async (_dbId: string, _collection: string, _docId: string, _data: unknown) =>
		({ $id: "new-id" }) as unknown,
);
const mockUpdateDocument = mock(
	async (_dbId: string, _collection: string, _docId: string, _data: unknown) =>
		null,
);

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		listDocuments: mockListDocuments,
		getDocument: async () => null,
		createDocument: mockCreateDocument,
		updateDocument: mockUpdateDocument,
		deleteDocument: async () => null,
	},
}));

mock.module("@/lib/exams/helpers", () => ({
	parseExamPaperFilename: mock((_filename: string) => null),
}));

mock.module("@/lib/subjects", () => {
	// Re-export real module to avoid breaking other tests
	// biome-ignore lint/style/noCommonJs: required by bun mock.module factory
	const real = require("@/lib/subjects") as typeof import("@/lib/subjects");
	return {
		...real,
		getSubjectAbbr: mock(real.getSubjectAbbr),
		getSubjectName: mock(real.getSubjectName),
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
