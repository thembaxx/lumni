import { mock } from "bun:test";

export const mockCreateDocument = mock(() => Promise.resolve());
export const mockGetDocument = mock(() => Promise.resolve(null));

mock.module("@/lib/shared/json", () => ({
	safeJsonParse: (str: string, fallback: unknown) => {
		try {
			return JSON.parse(str);
		} catch {
			return fallback;
		}
	},
	safeJsonStringify: (value: unknown) => JSON.stringify(value),
}));

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		createDocument: mockCreateDocument,
		getDocument: mockGetDocument,
	},
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
	serverAccount: {},
	serverClient: {},
}));

mock.module("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db-id",
	COLLECTIONS: { VISUALS: "visuals" },
}));
