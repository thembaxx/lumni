import { beforeEach, describe, expect, test, vi } from "vitest";

let mockUserId: string | null = "user_abc";

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
		if (!mockUserId) throw new Error("Authentication required");
		return mockUserId;
	},
	verifyAuth: async () => {},
	getAuthenticatedUserId: async () => mockUserId,
	requireAdmin: async () => mockUserId,
	getAuthenticatedUserName: async () => "Test User",
}));

let mockSubjectDocs: Record<string, unknown>[] = [];

vi.mock("@/lib/db/client", () => ({
	COLLECTIONS: {
		SUBJECTS: "subjects",
	},
	listDocuments: vi.fn(async (collection: string, _queries?: string[]) => {
		if (collection === "subjects") {
			return mockSubjectDocs;
		}
		return [];
	}),
}));

const { syncSubject, syncAllSubjects, checkSubjectStatus, refreshSubject } =
	await import("../sync-actions");

beforeEach(() => {
	mockUserId = "user_abc";
	mockSubjectDocs = [];
});

describe("syncSubject", () => {
	test("returns auth error when not authenticated", async () => {
		mockUserId = null;
		await expect(syncSubject("mathematics")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("returns success result when authenticated", async () => {
		mockSubjectDocs = [{ code: "mathematics", sourceVersion: "v2" }];
		const result = await syncSubject("mathematics");

		expect(result.success).toBe(true);
		expect(result.version).toBe("v2");
	});
});

describe("syncAllSubjects", () => {
	test("returns results for all known subjects", async () => {
		const result = await syncAllSubjects();

		expect(result.results).toHaveLength(8);
		expect(result.results.map((r) => r.subject)).toContain("mathematics");
		expect(result.results.map((r) => r.subject)).toContain("history");
	});

	test("each result has correct shape", async () => {
		mockSubjectDocs = [
			{ code: "mathematics", sourceVersion: "v2" },
			{ code: "history", sourceVersion: "v2" },
			{ code: "geography", sourceVersion: "v2" },
			{ code: "accounting", sourceVersion: "v2" },
			{ code: "economics", sourceVersion: "v2" },
			{ code: "business-studies", sourceVersion: "v2" },
			{ code: "life-sciences", sourceVersion: "v2" },
			{ code: "english", sourceVersion: "v2" },
		];
		const result = await syncAllSubjects();

		for (const r of result.results) {
			expect(r).toEqual({
				subject: r.subject,
				success: true,
				synced: 0,
				local: 0,
				version: "v2",
			});
		}
	});
});

describe("checkSubjectStatus", () => {
	test("returns not-exists when not authenticated", async () => {
		mockUserId = null;
		await expect(checkSubjectStatus("mathematics")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("returns exists=true when subject found in Appwrite", async () => {
		mockSubjectDocs = [{ $id: "subj1", sourceVersion: "v1" }];

		const result = await checkSubjectStatus("mathematics");

		expect(result.exists).toBe(true);
		expect(result.version).toBe("v1");
		expect(result.needsSync).toBe(false);
	});

	test("returns needsSync=true when subject has no sourceVersion", async () => {
		mockSubjectDocs = [{ $id: "subj1", sourceVersion: "" }];

		const result = await checkSubjectStatus("mathematics");

		expect(result.exists).toBe(true);
		expect(result.version).toBeNull();
		expect(result.needsSync).toBe(true);
	});

	test("returns not-exists when subject collection is empty", async () => {
		mockSubjectDocs = [];

		const result = await checkSubjectStatus("mathematics");

		expect(result.exists).toBe(false);
		expect(result.needsSync).toBe(true);
	});
});

describe("refreshSubject", () => {
	test("returns auth error when not authenticated", async () => {
		mockUserId = null;
		await expect(refreshSubject("mathematics")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("returns fresh result when authenticated", async () => {
		const result = await refreshSubject("mathematics");

		expect(result.success).toBe(true);
		expect(result.isFresh).toBe(true);
	});
});
