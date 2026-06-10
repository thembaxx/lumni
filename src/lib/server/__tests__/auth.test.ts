import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	test,
	vi,
} from "vitest";

process.env.APPWRITE_DATABASE_ID = "test-db-id";
process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID = "test-project";

const { authState } = vi.hoisted(() => ({
	authState: {
		sessionCookieValue: "session123",
		userId: "user_abc",
		userName: "Test User",
		getRejects: false,
	} as {
		sessionCookieValue: string | null;
		userId: string | null;
		userName: string;
		getRejects: boolean;
	},
}));

vi.mock("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {},
	serverAccount: {},
	serverClient: {},
}));

vi.mock("next/headers", () => ({
	cookies: async () => ({
		get: (name: string) => {
			if (
				name === "a_session_test-project" &&
				authState.sessionCookieValue != null
			) {
				return { name, value: authState.sessionCookieValue };
			}
			return undefined;
		},
		getAll: () =>
			authState.sessionCookieValue != null
				? [
						{
							name: "a_session_test-project",
							value: authState.sessionCookieValue,
						},
					]
				: [],
	}),
}));

vi.mock("node-appwrite", () => {
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
		AppwriteException: MockAppwriteException,
		Query: {
			equal: (...args: string[]) => args,
			limit: (n: number) => [`limit(${n})`],
		},
	};
});

const OLD_ENV = process.env;

let verifyAuth: (userId: string) => Promise<void>;
let getAuthenticatedUserId: () => Promise<string | null>;
let requireAdmin: () => Promise<string>;
let getAuthenticatedUserName: () => Promise<string | null>;

beforeAll(async () => {
	const mod = await import(
		`../auth?_auth_test=${Date.now()}_${Math.random().toString(36).slice(2)}`
	);
	verifyAuth = mod.verifyAuth;
	getAuthenticatedUserId = mod.getAuthenticatedUserId;
	requireAdmin = mod.requireAdmin;
	getAuthenticatedUserName = mod.getAuthenticatedUserName;
});

beforeEach(() => {
	authState.sessionCookieValue = "session123";
	authState.userId = "user_abc";
	authState.userName = "Test User";
	authState.getRejects = false;
	process.env = { ...OLD_ENV };
	delete process.env.ADMIN_USER_IDS;
});

afterAll(() => {
	process.env = OLD_ENV;
});

describe("verifyAuth", () => {
	test("resolves when session is valid and userId matches", async () => {
		await expect(verifyAuth("user_abc")).resolves.toBeUndefined();
	});

	test("throws when userId does not match", async () => {
		authState.userId = "other_user";
		await expect(verifyAuth("user_abc")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("throws when no session cookie exists", async () => {
		authState.sessionCookieValue = null;
		await expect(verifyAuth("user_abc")).rejects.toThrow(
			"Authentication required",
		);
	});

	test("throws when account.get fails", async () => {
		authState.getRejects = true;
		await expect(verifyAuth("user_abc")).rejects.toThrow(
			"Authentication required",
		);
	});
});

describe("getAuthenticatedUserId", () => {
	test("returns userId when authenticated", async () => {
		const id = await getAuthenticatedUserId();
		expect(id).toBe("user_abc");
	});

	test("returns null when no session cookie", async () => {
		authState.sessionCookieValue = null;
		const id = await getAuthenticatedUserId();
		expect(id).toBeNull();
	});

	test("returns null when account.get throws", async () => {
		authState.getRejects = true;
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
		authState.sessionCookieValue = null;
		await expect(requireAdmin()).rejects.toThrow("Authentication required");
	});

	test("throws when user is not in admin list", async () => {
		process.env.ADMIN_USER_IDS = "admin_xyz,admin_123";
		await expect(requireAdmin()).rejects.toThrow("Admin access required");
	});

	test("throws when ADMIN_USER_IDS is empty", async () => {
		process.env.ADMIN_USER_IDS = "";
		await expect(requireAdmin()).rejects.toThrow(
			"Admin access is not configured",
		);
	});

	test("throws when ADMIN_USER_IDS not set", async () => {
		delete process.env.ADMIN_USER_IDS;
		await expect(requireAdmin()).rejects.toThrow(
			"Admin access is not configured",
		);
	});
});

describe("getAuthenticatedUserName", () => {
	test("returns user name when authenticated", async () => {
		const name = await getAuthenticatedUserName();
		expect(name).toBe("Test User");
	});

	test("returns null when no session cookie", async () => {
		authState.sessionCookieValue = null;
		const name = await getAuthenticatedUserName();
		expect(name).toBeNull();
	});

	test("returns null when account.get throws", async () => {
		authState.getRejects = true;
		const name = await getAuthenticatedUserName();
		expect(name).toBeNull();
	});

	test("returns null when user has no name", async () => {
		authState.userName = "";
		const name = await getAuthenticatedUserName();
		expect(name).toBeNull();
	});
});
