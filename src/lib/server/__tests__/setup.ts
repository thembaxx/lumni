process.env.APPWRITE_DATABASE_ID = "test-db-id";
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "test-project";

import { mock } from "bun:test";

export const authState: {
	sessionCookieValue: string | null;
	userId: string | null;
	userName: string;
	getRejects: boolean;
} = {
	sessionCookieValue: "session123",
	userId: "user_abc",
	userName: "Test User",
	getRejects: false,
};

mock.module("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) => {
			if (
				name === `a_session_test-project` &&
				authState.sessionCookieValue != null
			) {
				return { name, value: authState.sessionCookieValue };
			}
			if (name === `a_session_test-project_legacy`) return undefined;
			return undefined;
		},
		getAll: () =>
			authState.sessionCookieValue != null
				? [
						{
							name: `a_session_test-project`,
							value: authState.sessionCookieValue,
						},
					]
				: [],
	}),
}));

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		listDocuments: () => ({ documents: [], total: 0 }),
		getDocument: () => null,
		createDocument: () => ({ $id: "doc-id" }),
		updateDocument: () => {},
		deleteDocument: () => {},
	},
	serverAccount: {},
	serverClient: {},
	account: {},
	storage: {},
	functions: {},
	browserDatabases: {},
}));

mock.module("node-appwrite", () => {
	class MockClient {
		setEndpoint() {
			return this;
		}
		setProject() {
			return this;
		}
		setSession() {
			return this;
		}
		setKey() {
			return this;
		}
	}
	class MockAccount {
		_client: unknown;
		constructor(client: unknown) {
			this._client = client;
		}
		async get() {
			if (authState.getRejects) throw new Error("Account get rejected");
			if (!authState.userId) throw new Error("No user");
			return {
				$id: authState.userId,
				name: authState.userName,
				email: `${authState.userId}@test.com`,
			};
		}
	}
	class MockDatabases {
		listDocuments() {
			return { documents: [], total: 0 };
		}
		getDocument() {
			return null;
		}
		createDocument() {
			return { $id: "doc-id" };
		}
		updateDocument() {}
		deleteDocument() {}
	}
	class MockAppwriteException extends Error {
		code = 0;
		constructor(code: number, message: string) {
			super(message);
			this.code = code;
			this.name = "AppwriteException";
		}
	}
	return {
		Client: MockClient,
		Account: MockAccount,
		Databases: MockDatabases,
		Query: {
			equal: (f: string, v: string) => `${f}=${v}`,
		},
		AppwriteException: MockAppwriteException,
		Users: class MockUsers {},
	};
});
