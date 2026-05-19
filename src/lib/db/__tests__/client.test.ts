import { beforeEach, describe, expect, mock, test } from "bun:test";

const mockDb = {
	listDocuments: mock(async () => ({ documents: [] })),
	getDocument: mock(async () => ({})),
	createDocument: mock(async () => ({ $id: "doc-123" })),
	updateDocument: mock(async () => {}),
	deleteDocument: mock(async () => {}),
};

process.env.APPWRITE_DATABASE_ID = "test-db-id";

mock.module("@/lib/appwrite", () => ({
	databases: mockDb,
}));

const { COLLECTIONS, listDocuments, createDocument, getDocument, updateDocument, deleteDocument } =
	await import("../client");

describe("COLLECTIONS", () => {
	test("has 14 keys", () => {
		expect(Object.keys(COLLECTIONS)).toHaveLength(14);
	});

	test("contains all expected collection keys", () => {
		expect(COLLECTIONS.SUBJECTS).toBe("subjects");
		expect(COLLECTIONS.TOPICS).toBe("topics");
		expect(COLLECTIONS.QUESTIONS).toBe("questions");
		expect(COLLECTIONS.USER_SUBJECTS).toBe("user_subjects");
		expect(COLLECTIONS.USER_PROGRESS).toBe("user_progress");
		expect(COLLECTIONS.STUDY_SESSIONS).toBe("study_sessions");
		expect(COLLECTIONS.EXAM_PAPERS).toBe("exam_papers");
		expect(COLLECTIONS.VISUALS).toBe("visuals");
		expect(COLLECTIONS.COMPETENCIES).toBe("competencies");
		expect(COLLECTIONS.EXAM_SESSIONS).toBe("exam_sessions");
		expect(COLLECTIONS.REFERRAL_CODES).toBe("referral_codes");
		expect(COLLECTIONS.REFERRALS).toBe("referrals");
		expect(COLLECTIONS.STUDY_PLANS).toBe("study_plans");
		expect(COLLECTIONS.QUESTION_FLAGS).toBe("question_flags");
	});

	test("all values are non-empty strings", () => {
		for (const [key, value] of Object.entries(COLLECTIONS)) {
			expect(typeof value).toBe("string");
			expect(value.length).toBeGreaterThan(0);
		}
	});
});

describe("listDocuments", () => {
	beforeEach(() => {
		mockDb.listDocuments.mockReset();
		mockDb.listDocuments.mockResolvedValue({ documents: [] });
	});

	test("is a function", () => {
		expect(typeof listDocuments).toBe("function");
	});

	test("passes database ID, collection, and queries to Appwrite", async () => {
		await listDocuments("questions", ["limit(10)", "offset(0)"]);
		expect(mockDb.listDocuments).toHaveBeenCalledWith(
			"test-db-id",
			"questions",
			["limit(10)", "offset(0)"],
		);
	});

	test("defaults queries to empty array", async () => {
		await listDocuments("subjects");
		expect(mockDb.listDocuments).toHaveBeenCalledWith("test-db-id", "subjects", []);
	});

	test("returns documents array", async () => {
		mockDb.listDocuments.mockResolvedValue({
			documents: [{ $id: "1" }, { $id: "2" }],
		});
		const result = await listDocuments("subjects");
		expect(result).toHaveLength(2);
	});
});

describe("createDocument", () => {
	beforeEach(() => {
		mockDb.createDocument.mockReset();
		mockDb.createDocument.mockResolvedValue({ $id: "doc-123" });
	});

	test("is a function", () => {
		expect(typeof createDocument).toBe("function");
	});

	test("returns document $id", async () => {
		const id = await createDocument("subjects", { name: "Math" });
		expect(id).toBe("doc-123");
	});

	test("passes data with unique() ID", async () => {
		await createDocument("topics", { name: "Algebra", subjectId: "math" });
		expect(mockDb.createDocument).toHaveBeenCalledWith(
			"test-db-id",
			"topics",
			"unique()",
			{ name: "Algebra", subjectId: "math" },
		);
	});
});

describe("getDocument", () => {
	beforeEach(() => {
		mockDb.getDocument.mockReset();
	});

	test("returns document when found", async () => {
		mockDb.getDocument.mockResolvedValue({ $id: "doc-1", name: "Test" });
		const doc = await getDocument("subjects", "doc-1");
		expect(doc).toEqual({ $id: "doc-1", name: "Test" });
	});

	test("returns null when not found (Appwrite throws)", async () => {
		mockDb.getDocument.mockRejectedValue(new Error("not found"));
		const doc = await getDocument("subjects", "nonexistent");
		expect(doc).toBeNull();
	});
});

describe("updateDocument", () => {
	beforeEach(() => {
		mockDb.updateDocument.mockReset();
	});

	test("calls Appwrite updateDocument with correct args", async () => {
		await updateDocument("subjects", "doc-1", { name: "Updated" });
		expect(mockDb.updateDocument).toHaveBeenCalledWith(
			"test-db-id",
			"subjects",
			"doc-1",
			{ name: "Updated" },
		);
	});
});

describe("deleteDocument", () => {
	beforeEach(() => {
		mockDb.deleteDocument.mockReset();
	});

	test("calls Appwrite deleteDocument with correct args", async () => {
		await deleteDocument("subjects", "doc-1");
		expect(mockDb.deleteDocument).toHaveBeenCalledWith(
			"test-db-id",
			"subjects",
			"doc-1",
		);
	});
});
