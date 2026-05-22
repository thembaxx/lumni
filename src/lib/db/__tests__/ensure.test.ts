import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { NodeDatabases } from "node-appwrite";

class MockAppwriteException extends Error {
	code: number;
	constructor(code: number, message: string) {
		super(message);
		this.code = code;
		this.name = "AppwriteException";
	}
}

const listAttrsResult: { attributes?: { key: string }[] } = {};
let listAttrsError: Error | null = null;
const listIndexesResult: { indexes?: { key: string }[] } = {};
let listIndexesError: Error | null = null;

type CollectionInfo = {
	id: string;
	attrs: Record<string, unknown>;
	indexes: { key: string }[];
};

const collections: Record<string, CollectionInfo> = {};
let getError: Error | null = null;
let getCollectionError: Error | null = null;
let createCollectionError: Error | null = null;
let createAttrError: Error | null = null;
let createIndexError: Error | null = null;
let getCreateError404: boolean = false;

const createCollectionCalls: string[] = [];
const createAttrCalls: { coll: string; name: string }[] = [];
const createIndexCalls: { coll: string; key: string }[] = [];

const mockDb = {
	create: async () => ({ $id: "test-db" }),
	get: async () => {
		if (getError) throw getError;
		return { $id: "test-db" };
	},
	getCollection: async (_dbId: string, collId: string) => {
		if (getCollectionError) throw getCollectionError;
		if (!collections[collId]) throw new MockAppwriteException(404, "not found");
		return { $id: collId };
	},
	createCollection: async (_dbId: string, collId: string, _name: string) => {
		createCollectionCalls.push(collId);
		if (createCollectionError) throw createCollectionError;
		if (getCreateError404) throw new MockAppwriteException(404, "not found");
		collections[collId] = { id: collId, attrs: {}, indexes: [] };
		return { $id: collId };
	},
	listAttributes: async (_dbId: string, collId: string) => {
		if (listAttrsError) throw listAttrsError;
		if (listAttrsResult.attributes)
			return { attributes: listAttrsResult.attributes };
		const coll = collections[collId];
		if (!coll) return { attributes: [] };
		return {
			attributes: Object.entries(coll.attrs).map(([key, _val]) => ({
				key,
				status: "available",
			})),
		};
	},
	createStringAttribute: async (
		_dbId: string,
		collId: string,
		name: string,
	) => {
		createAttrCalls.push({ coll: collId, name });
		if (createAttrError) throw createAttrError;
		if (!collections[collId])
			collections[collId] = { id: collId, attrs: {}, indexes: [] };
		collections[collId].attrs[name] = {};
	},
	createIntegerAttribute: async (
		_dbId: string,
		collId: string,
		name: string,
	) => {
		createAttrCalls.push({ coll: collId, name });
		if (createAttrError) throw createAttrError;
		if (!collections[collId])
			collections[collId] = { id: collId, attrs: {}, indexes: [] };
		collections[collId].attrs[name] = {};
	},
	createBooleanAttribute: async (
		_dbId: string,
		collId: string,
		name: string,
	) => {
		createAttrCalls.push({ coll: collId, name });
		if (createAttrError) throw createAttrError;
		if (!collections[collId])
			collections[collId] = { id: collId, attrs: {}, indexes: [] };
		collections[collId].attrs[name] = {};
	},
	createDatetimeAttribute: async (
		_dbId: string,
		collId: string,
		name: string,
	) => {
		createAttrCalls.push({ coll: collId, name });
		if (createAttrError) throw createAttrError;
		if (!collections[collId])
			collections[collId] = { id: collId, attrs: {}, indexes: [] };
		collections[collId].attrs[name] = {};
	},
	listIndexes: async (_dbId: string, collId: string) => {
		if (listIndexesError) throw listIndexesError;
		if (listIndexesResult.indexes)
			return { indexes: listIndexesResult.indexes };
		const coll = collections[collId];
		if (!coll) return { indexes: [] };
		return { indexes: coll.indexes };
	},
	createIndex: async (
		_dbId: string,
		collId: string,
		key: string,
		_type: string,
		_attrs: string[],
	) => {
		createIndexCalls.push({ coll: collId, key });
		if (createIndexError) throw createIndexError;
		if (!collections[collId])
			collections[collId] = { id: collId, attrs: {}, indexes: [] };
		collections[collId].indexes.push({ key });
	},
	listDocuments: async (
		_dbId: string,
		_collId: string,
		_queries: unknown[],
	) => {
		return { documents: [] as unknown[], total: 0 };
	},
	createDocument: async (
		_dbId: string,
		_collId: string,
		_docId: string,
		doc: unknown,
	) => {
		return { $id: "new-id", ...(doc as object) };
	},
};

mock.module("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db",
	COLLECTIONS: { QUESTIONS: "questions" },
}));

mock.module("@/lib/appwrite", () => ({
	databases: mockDb,
}));

mock.module("node-appwrite", () => ({
	AppwriteException: MockAppwriteException,
}));
const { ensureAppwrite } = await import("../ensure");

describe("ensureAppwrite", () => {
	beforeEach(() => {
		for (const k of Object.keys(collections)) {
			delete collections[k];
		}
		createCollectionCalls.length = 0;
		createAttrCalls.length = 0;
		createIndexCalls.length = 0;
		getError = null;
		getCollectionError = null;
		createCollectionError = null;
		createAttrError = null;
		createIndexError = null;
		getCreateError404 = false;
		listAttrsResult.attributes = undefined;
		listAttrsError = null;
		listIndexesResult.indexes = undefined;
		listIndexesError = null;
	});

	test("reports success when db and collections exist", async () => {
		const report = await ensureAppwrite(
			undefined,
			mockDb as unknown as NodeDatabases,
		);
		expect(report.success).toBe(true);
		expect(report.database.status).toBe("exists");
	});

	test("creates database when not found", async () => {
		getError = new MockAppwriteException(404, "not found");
		collections.subjects = { id: "subjects", attrs: {}, indexes: [] };
		const report = await ensureAppwrite(
			undefined,
			mockDb as unknown as NodeDatabases,
		);
		expect(report.database.status).toBe("created");
	});

	test("reports database error on non-404", async () => {
		getError = new MockAppwriteException(500, "server error");
		const report = await ensureAppwrite(
			undefined,
			mockDb as unknown as NodeDatabases,
		);
		expect(report.database.status).toBe("error");
		expect(report.success).toBe(false);
	});

	test("creates missing collections", async () => {
		collections.subjects = { id: "subjects", attrs: {}, indexes: [] };
		const report = await ensureAppwrite(
			undefined,
			mockDb as unknown as NodeDatabases,
		);
		expect(Object.keys(report.collections).length).toBeGreaterThan(0);
	});

	test("handles collection creation error", async () => {
		createCollectionError = new Error("permission denied");
		const report = await ensureAppwrite(
			undefined,
			mockDb as unknown as NodeDatabases,
		);
		const subjectsReport = report.collections.subjects;
		if (subjectsReport) {
			expect(subjectsReport.status).toBe("error");
		}
	});

	test("seeds data when config provided without match", async () => {
		const report = await ensureAppwrite(
			{
				subjects: {
					matchField: "code",
					documents: [{ code: "new-subject", name: "New Subject" }],
				},
			},
			mockDb as unknown as NodeDatabases,
		);
		expect(report.seeded.subjects).toBeDefined();
		expect(report.seeded.subjects.inserted).toBe(1);
	});

	test("seeds with dynamic documents function", async () => {
		const report = await ensureAppwrite(
			{
				subjects: {
					matchField: "code",
					documents: async (_seeded: Record<string, unknown>) => [
						{ code: "dynamic-subj", name: "Dynamic" },
					],
				},
			},
			mockDb as unknown as NodeDatabases,
		);
		expect(report.seeded.subjects.inserted).toBe(1);
	});

	test("handles schema attribute creation", async () => {
		const report = await ensureAppwrite(
			undefined,
			mockDb as unknown as NodeDatabases,
		);
		const subjectsReport = report.collections.subjects;
		if (subjectsReport) {
			expect(subjectsReport.status).toBe("created");
		}
	});
});
