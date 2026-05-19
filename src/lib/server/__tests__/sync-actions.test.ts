import { beforeEach, describe, expect, mock, test } from "bun:test";

let mockUserId: string | null = "user_abc";

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
}));

mock.module("@/lib/server/auth", () => ({
	getAuthenticatedUserId: async () => mockUserId,
}));

let mockSubjectDocs: Record<string, unknown>[] = [];

mock.module("@/lib/db/client", () => ({
	COLLECTIONS: {
		SUBJECTS: "subjects",
	},
	listDocuments: mock(async (collection: string, _queries?: string[]) => {
		if (collection === "subjects") {
			return mockSubjectDocs;
		}
		return [];
	}),
}));

const {
	syncSubject,
	syncAllSubjects,
	checkSubjectStatus,
	refreshSubject,
} = await import("../sync-actions");

beforeEach(() => {
	mockUserId = "user_abc";
	mockSubjectDocs = [];
});

describe("syncSubject", () => {
	test("returns auth error when not authenticated", async () => {
		mockUserId = null;
		const result = await syncSubject("mathematics");

		expect(result.success).toBe(false);
		expect(result.error).toBe("Authentication required");
	});

	test("returns success result when authenticated", async () => {
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
		const result = await checkSubjectStatus("mathematics");

		expect(result.exists).toBe(false);
		expect(result.needsSync).toBe(false);
	});

	test("returns exists=true when subject found in Appwrite", async () => {
		mockSubjectDocs = [
			{ $id: "subj1", sourceVersion: "v1" },
		];

		const result = await checkSubjectStatus("mathematics");

		expect(result.exists).toBe(true);
		expect(result.version).toBe("v1");
		expect(result.needsSync).toBe(false);
	});

	test("returns needsSync=true when subject has no sourceVersion", async () => {
		mockSubjectDocs = [
			{ $id: "subj1", sourceVersion: "" },
		];

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
		const result = await refreshSubject("mathematics");

		expect(result.success).toBe(false);
		expect(result.error).toBe("Authentication required");
	});

	test("returns fresh result when authenticated", async () => {
		const result = await refreshSubject("mathematics");

		expect(result.success).toBe(true);
		expect(result.isFresh).toBe(true);
	});
});
