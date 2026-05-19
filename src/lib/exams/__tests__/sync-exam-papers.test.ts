import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockUploadFiles = mock(
	async (): Promise<{ data: { ufsUrl: string; key: string }; error: null }> => ({
		data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
		error: null,
	}),
);

let mockExistsSync = mock((_path: string) => false);
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

const getExamPaperCountMock = mock(() => 0);
const insertExamPaperMock = mock((_record: Record<string, unknown>) => {});
const findPaperForMemoMock = mock(
	(_subjectCode: string, _year: number, _paperNumber: number) => null,
);
const updateExamPaperMemoLinkMock = mock(
	(_paperId: string, _memoId: string) => {},
);

mock.module("@/lib/db/exams", () => ({
	findPaperForMemo: findPaperForMemoMock,
	getExamPaperCount: getExamPaperCountMock,
	insertExamPaper: insertExamPaperMock,
	updateExamPaperMemoLink: updateExamPaperMemoLinkMock,
	updateExamPaperPaperLink: mock(() => {}),
}));

mock.module("@/lib/db/exams/schema", () => ({
	getSubjectName: mock(
		(code: string) => code.charAt(0).toUpperCase() + code.slice(1),
	),
	parseExamPaperFilename: mock((_filename: string) => null),
}));

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
		getExamPaperCountMock.mockReset();
		insertExamPaperMock.mockReset();
		mockExistsSync.mockReset();
		mockReaddirSync.mockReset();
		mockWriteFileSync.mockReset();
		mockUploadFiles.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		});
	});

	test("sets syncCompleted when exam papers already exist", async () => {
		getExamPaperCountMock.mockReturnValue(5);
		await ensureExamPapersSynced();
		expect(isSyncCompleted()).toBe(true);
	});

	test("does not call internal sync when syncCompleted", async () => {
		getExamPaperCountMock.mockReturnValue(5);
		await ensureExamPapersSynced();
		const spy = mock(() => {});
		const countBefore = getExamPaperCountMock.mock.calls.length;
		await ensureExamPapersSynced();
		expect(getExamPaperCountMock.mock.calls.length).toBe(countBefore);
	});

	test("scans local PDFs when no papers in DB", async () => {
		getExamPaperCountMock.mockReturnValue(0);
		mockReaddirSync.mockReturnValue(["2024_mathematics_p1.pdf"]);
		mockExistsSync.mockReturnValue(false);
		const result = await syncExamPapers();
		expect(result).toMatchObject({ uploaded: 0, errors: [] });
	});
});

describe("syncExamPapers", () => {
	beforeEach(() => {
		getExamPaperCountMock.mockReset();
		mockReaddirSync.mockReset();
		mockExistsSync.mockReset();
		mockUploadFiles.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		});
	});

	test("returns result with zero counts when no PDFs exist", async () => {
		getExamPaperCountMock.mockReturnValue(0);
		mockExistsSync.mockReturnValue(false);
		mockReaddirSync.mockReturnValue([]);
		const result = await syncExamPapers();
		expect(result).toEqual({ uploaded: 0, skipped: 0, errors: [] });
	});
});

describe("forceSyncExamPapers", () => {
	beforeEach(() => {
		getExamPaperCountMock.mockReset();
		mockReaddirSync.mockReset();
		mockExistsSync.mockReset();
		mockUploadFiles.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://utfs.io/f/test-key", key: "test-key" },
			error: null,
		});
	});

	test("forces re-upload when force=true", async () => {
		getExamPaperCountMock.mockReturnValue(0);
		mockExistsSync.mockReturnValue(false);
		mockReaddirSync.mockReturnValue([]);
		const result = await forceSyncExamPapers();
		expect(result).toMatchObject({ uploaded: 0, skipped: 0, errors: [] });
	});
});
