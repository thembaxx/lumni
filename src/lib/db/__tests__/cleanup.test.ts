import { describe, expect, mock, test } from "bun:test";

const deleteErrors: string[] = [];
const mockDocs: Array<{ $id: string; createdAt: string }> = [];

const mockDatabases = {
	listDocuments: async (
		_dbId: string,
		_collId: string,
		_queries: unknown[],
	) => {
		const docs = mockDocs.splice(0);
		return {
			documents: docs,
			total: docs.length,
		};
	},
	deleteDocument: async (_dbId: string, _collId: string, docId: string) => {
		if (deleteErrors.length > 0)
			throw new Error(deleteErrors.shift() as string);
		const idx = mockDocs.findIndex((d) => d.$id === docId);
		if (idx >= 0) mockDocs.splice(idx, 1);
	},
};

mock.module("@/lib/appwrite", () => ({
	databases: mockDatabases,
	browserDatabases: mockDatabases,
	storage: {},
	functions: {},
	account: {},
	serverAccount: {},
	serverClient: {},
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
}));

const { cleanupOldQuestions } = await import("../cleanup");

describe("cleanup", () => {
	test("cleanupOldQuestions deletes old documents", async () => {
		mockDocs.length = 0;
		deleteErrors.length = 0;
		mockDocs.push({
			$id: "old-1",
			createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
		});
		mockDocs.push({
			$id: "old-2",
			createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
		});
		const result = await cleanupOldQuestions();
		expect(result.deleted).toBe(2);
	});

	test("cleanupOldQuestions handles no old docs", async () => {
		mockDocs.length = 0;
		deleteErrors.length = 0;
		const result = await cleanupOldQuestions();
		expect(result.deleted).toBe(0);
	});

	test("cleanupOldQuestions catches delete errors gracefully", async () => {
		mockDocs.length = 0;
		deleteErrors.length = 0;
		deleteErrors.push("network error");
		mockDocs.push({
			$id: "bad",
			createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
		});
		const result = await cleanupOldQuestions();
		expect(result.deleted).toBe(1);
	});

	test("cleanupOldQuestions handles exceptions gracefully", async () => {
		mockDocs.length = 0;
		deleteErrors.length = 0;
		mockDatabases.listDocuments = async () => {
			throw new Error("list failed");
		};
		const result = await cleanupOldQuestions();
		expect(result.deleted).toBe(0);
		expect(result.error).toBeDefined();

		// reset
		mockDatabases.listDocuments = async (
			_dbId: string,
			_collId: string,
			_queries: unknown[],
		) => {
			const docs = mockDocs.splice(0);
			return { documents: docs, total: docs.length };
		};
	});
});
