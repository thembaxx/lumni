import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { authState } from "./setup";

const OLD_ENV = process.env;

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
