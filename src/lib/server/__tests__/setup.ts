process.env.APPWRITE_DATABASE_ID = "test-db-id";

import { mock } from "bun:test";

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
			return { $id: "user_abc", name: "Test User" };
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
