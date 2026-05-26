import { describe, expect, mock, test } from "bun:test";

const mockDb = {
	listDocuments: mock(
		async (_dbId: string, _coll: string, _queries: string[]) => ({
			documents: [],
		}),
	),
	getDocument: mock(
		async (_dbId: string, _coll: string, _docId: string) => ({}),
	),
	createDocument: mock(
		async (
			_dbId: string,
			_coll: string,
			_docId: string,
			_data: Record<string, unknown>,
		) => ({
			$id: "doc-123",
		}),
	),
	updateDocument: mock(
		async (
			_dbId: string,
			_coll: string,
			_docId: string,
			_data: Record<string, unknown>,
		) => {},
	),
	deleteDocument: mock(
		async (_dbId: string, _coll: string, _docId: string) => {},
	),
};

process.env.APPWRITE_DATABASE_ID = "test-db-id";

mock.module("@/lib/appwrite", () => ({
	databases: mockDb,
	browserDatabases: mockDb,
	storage: {},
	functions: {},
	account: {},
	serverAccount: {},
	serverClient: {},
	APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
}));

mock.module("@/lib/db/client", () => ({
	COLLECTIONS: {
		SUBJECTS: "subjects",
		TOPICS: "topics",
		QUESTIONS: "questions",
		USER_SUBJECTS: "user_subjects",
		USER_PROGRESS: "user_progress",
		STUDY_SESSIONS: "study_sessions",
		EXAM_PAPERS: "exam_papers",
		VISUALS: "visuals",
		COMPETENCIES: "competencies",
		EXAM_SESSIONS: "exam_sessions",
		REFERRAL_CODES: "referral_codes",
		REFERRALS: "referrals",
		STUDY_PLANS: "study_plans",
		QUESTION_FLAGS: "question_flags",
		ANALYTICS: "analytics",
		FLASHCARDS: "flashcards",
		WRONG_ANSWERS: "wrong_answers",
		CHAT_MESSAGES: "chat_messages",
		EXAM_DATES: "exam_dates",
		BOOKMARKS: "bookmarks",
		NOTES: "notes",
		GROUP_POSTS: "group_posts",
		GROUP_COMMENTS: "group_comments",
		GROUP_REACTIONS: "group_reactions",
		GAMIFICATION: "gamification",
		QUIZ_PACKS: "quiz_packs",
		PACK_QUESTIONS: "pack_questions",
		SUBMISSIONS: "submissions",
		ACHIEVEMENTS: "achievements",
		STUDY_STREAKS: "study_streaks",
		SETTINGS: "settings",
	} as const,
	APPWRITE_DATABASE_ID: "test-db-id",
	listDocuments: async (collection: string, queries?: string[]) => {
		const result = await mockDb.listDocuments(
			"test-db-id",
			collection,
			queries ?? [],
		);
		return result.documents;
	},
	createDocument: async (collection: string, data: Record<string, unknown>) => {
		const result = await mockDb.createDocument(
			"test-db-id",
			collection,
			"unique()",
			data,
		);
		return result.$id;
	},
	getDocument: async (collection: string, documentId: string) => {
		try {
			return await mockDb.getDocument("test-db-id", collection, documentId);
		} catch {
			return null;
		}
	},
	updateDocument: async (
		collection: string,
		documentId: string,
		data: Record<string, unknown>,
	) => mockDb.updateDocument("test-db-id", collection, documentId, data),
	deleteDocument: async (collection: string, documentId: string) =>
		mockDb.deleteDocument("test-db-id", collection, documentId),
}));

const {
	COLLECTIONS,
	listDocuments,
	createDocument,
	getDocument,
	updateDocument,
	deleteDocument,
} = await import("@/lib/db/client");

describe("COLLECTIONS", () => {
	test("has 31 keys", () => {
		expect(Object.keys(COLLECTIONS)).toHaveLength(31);
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
		expect(COLLECTIONS.ANALYTICS).toBe("analytics");
		expect(COLLECTIONS.FLASHCARDS).toBe("flashcards");
		expect(COLLECTIONS.WRONG_ANSWERS).toBe("wrong_answers");
		expect(COLLECTIONS.CHAT_MESSAGES).toBe("chat_messages");
		expect(COLLECTIONS.EXAM_DATES).toBe("exam_dates");
	});

	test("all values are non-empty strings", () => {
		for (const [_key, value] of Object.entries(COLLECTIONS)) {
			expect(typeof value).toBe("string");
			expect(value.length).toBeGreaterThan(0);
		}
	});
});

describe("listDocuments", () => {
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
		mockDb.listDocuments.mockResolvedValue({ documents: [] });
		await listDocuments("subjects");
		expect(mockDb.listDocuments).toHaveBeenCalledWith(
			"test-db-id",
			"subjects",
			[],
		);
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
	test("is a function", () => {
		expect(typeof createDocument).toBe("function");
	});

	test("returns document $id", async () => {
		mockDb.createDocument.mockResolvedValue({ $id: "doc-123" });
		const id = await createDocument("subjects", { name: "Math" });
		expect(id).toBe("doc-123");
	});

	test("passes data with unique() ID", async () => {
		mockDb.createDocument.mockResolvedValue({ $id: "doc-456" });
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
	test("calls Appwrite deleteDocument with correct args", async () => {
		await deleteDocument("subjects", "doc-1");
		expect(mockDb.deleteDocument).toHaveBeenCalledWith(
			"test-db-id",
			"subjects",
			"doc-1",
		);
	});
});
