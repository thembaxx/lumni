import { describe, expect, test } from "bun:test";
import { useAuthStore } from "../auth";

describe("useAuthStore", () => {
	test("initial state is loading with no user", () => {
		const state = useAuthStore.getState();
		expect(state.user).toBeNull();
		expect(state.status).toBe("loading");
		expect(state.isAnonymous).toBe(false);
		expect(state.error).toBeNull();
		expect(state.authReady).toBe(false);
	});

	test("setUser transitions to authenticated", () => {
		const { setUser } = useAuthStore.getState();
		const mockUser = { $id: "u1", email: "test@test.com" } as never;
		setUser(mockUser, "authenticated", false);

		const state = useAuthStore.getState();
		expect(state.user).toBe(mockUser);
		expect(state.status).toBe("authenticated");
		expect(state.isAnonymous).toBe(false);
		expect(state.error).toBeNull();
	});

	test("setUser with isAnonymous=true", () => {
		const { setUser } = useAuthStore.getState();
		const mockUser = { $id: "anon1" } as never;
		setUser(mockUser, "authenticated", true);

		const state = useAuthStore.getState();
		expect(state.user).toBe(mockUser);
		expect(state.isAnonymous).toBe(true);
	});

	test("setError stores error and does not change user", () => {
		const { setUser, setError } = useAuthStore.getState();
		setUser({ $id: "u1" } as never, "authenticated", false);
		setError("Something went wrong");

		const state = useAuthStore.getState();
		expect(state.error).toBe("Something went wrong");
		expect(state.user).not.toBeNull();
	});

	test("setError clears on subsequent setUser", () => {
		const { setUser, setError } = useAuthStore.getState();
		setError("Old error");
		setUser({ $id: "u2" } as never, "authenticated", false);

		const state = useAuthStore.getState();
		expect(state.error).toBeNull();
	});

	test("setAuthReady transitions to ready", () => {
		const { setAuthReady } = useAuthStore.getState();
		setAuthReady(true);

		expect(useAuthStore.getState().authReady).toBe(true);
	});

	test("reset returns to unauthenticated with ready=true", () => {
		const { setUser, setAuthReady, reset } = useAuthStore.getState();
		setUser({ $id: "u1" } as never, "authenticated", false);
		setAuthReady(true);
		reset();

		const state = useAuthStore.getState();
		expect(state.user).toBeNull();
		expect(state.status).toBe("unauthenticated");
		expect(state.isAnonymous).toBe(false);
		expect(state.error).toBeNull();
		expect(state.authReady).toBe(true);
	});
});
