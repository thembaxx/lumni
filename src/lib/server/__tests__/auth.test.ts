import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

let mockSessionCookieValue: string | null = "session123";
let mockUserId = "user_abc";
let mockUserName = "Test User";
let mockGetRejects = false;

const mockCookieGet = mock((_name: string) => {
	if (mockSessionCookieValue) {
		return { value: mockSessionCookieValue };
	}
	return undefined;
});

mock.module("next/headers", () => ({
	cookies: async () => ({
		get: mockCookieGet,
	}),
}));

class MockClient {
	setEndpoint(_ep: string) {
		return this;
	}
	setProject(_p: string) {
		return this;
	}
	setSession(_s: string) {
		return this;
	}
	setKey(_key: string) {
		return this;
	}
}

const mockAccountGet = mock(async () => ({
	$id: mockUserId,
	name: mockUserName,
}));

class MockAccount {
	_client: MockClient;
	constructor(client: MockClient) {
		this._client = client;
	}
	async get() {
		if (mockGetRejects) throw new Error("Not authenticated");
		return mockAccountGet();
	}
}

mock.module("node-appwrite", () => ({
	Client: MockClient,
	Account: MockAccount,
	Databases: class MockDatabases {
		constructor(_client: MockClient) {}
	},
	Query: {
		equal: (_field: string, _value: string) => `${_field}=${_value}`,
	},
}));

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {},
}));

const OLD_ENV = process.env;

beforeEach(() => {
	mockSessionCookieValue = "session123";
	mockUserId = "user_abc";
	mockUserName = "Test User";
	mockGetRejects = false;
	process.env = { ...OLD_ENV };
	delete process.env.ADMIN_USER_IDS;
});

afterAll(() => {
	process.env = OLD_ENV;
});

const {
	verifyAuth,
	getAuthenticatedUserId,
	requireAdmin,
	getAuthenticatedUserName,
} = await import("../auth");

describe("verifyAuth", () => {
	test("resolves when session is valid and userId matches", async () => {
		await expect(verifyAuth("user_abc")).resolves.toBeUndefined();
	});

	test("throws when userId does not match", async () => {
		mockUserId = "other_user";
		await expect(verifyAuth("user_abc")).rejects.toThrow("Authentication required");
	});

	test("throws when no session cookie exists", async () => {
		mockSessionCookieValue = null;
		await expect(verifyAuth("user_abc")).rejects.toThrow("Authentication required");
	});

	test("throws when account.get fails", async () => {
		mockGetRejects = true;
		await expect(verifyAuth("user_abc")).rejects.toThrow("Authentication required");
	});
});

describe("getAuthenticatedUserId", () => {
	test("returns userId when authenticated", async () => {
		const id = await getAuthenticatedUserId();
		expect(id).toBe("user_abc");
	});

	test("returns null when no session cookie", async () => {
		mockSessionCookieValue = null;
		const id = await getAuthenticatedUserId();
		expect(id).toBeNull();
	});

	test("returns null when account.get throws", async () => {
		mockGetRejects = true;
		const id = await getAuthenticatedUserId();
		expect(id).toBeNull();
	});
});

describe("requireAdmin", () => {
	test("returns userId when user is in admin list", async () => {
		process.env.ADMIN_USER_IDS = "user_abc,admin_xyz";
		const id = await requireAdmin();
		expect(id).toBe("user_abc");
	});

	test("throws when not authenticated", async () => {
		mockSessionCookieValue = null;
		await expect(requireAdmin()).rejects.toThrow("Authentication required");
	});

	test("throws when user is not in admin list", async () => {
		process.env.ADMIN_USER_IDS = "admin_xyz,admin_123";
		await expect(requireAdmin()).rejects.toThrow("Admin access required");
	});

	test("allows any authenticated user when ADMIN_USER_IDS is empty", async () => {
		process.env.ADMIN_USER_IDS = "";
		const id = await requireAdmin();
		expect(id).toBe("user_abc");
	});

	test("allows any authenticated user when ADMIN_USER_IDS not set", async () => {
		delete process.env.ADMIN_USER_IDS;
		const id = await requireAdmin();
		expect(id).toBe("user_abc");
	});
});

describe("getAuthenticatedUserName", () => {
	test("returns user name when authenticated", async () => {
		const name = await getAuthenticatedUserName();
		expect(name).toBe("Test User");
	});

	test("returns null when no session cookie", async () => {
		mockSessionCookieValue = null;
		const name = await getAuthenticatedUserName();
		expect(name).toBeNull();
	});

	test("returns null when account.get throws", async () => {
		mockGetRejects = true;
		const name = await getAuthenticatedUserName();
		expect(name).toBeNull();
	});

	test("returns null when user has no name", async () => {
		mockUserName = "";
		const name = await getAuthenticatedUserName();
		expect(name).toBeNull();
	});
});
