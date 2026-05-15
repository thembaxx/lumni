import type { Models } from "appwrite";
import { create } from "zustand";
import type { AuthStatus } from "@/lib/auth/auth-context";

interface AuthState {
	user: Models.User<Models.Preferences> | null;
	status: AuthStatus;
	isAnonymous: boolean;
	error: string | null;
	authReady: boolean;
	setUser: (
		user: Models.User<Models.Preferences> | null,
		status: AuthStatus,
		isAnonymous: boolean,
	) => void;
	setError: (error: string | null) => void;
	setAuthReady: (ready: boolean) => void;
	reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
	user: null,
	status: "loading",
	isAnonymous: false,
	error: null,
	authReady: false,
	setUser: (user, status, isAnonymous) =>
		set({ user, status, isAnonymous, error: null }),
	setError: (error) => set({ error }),
	setAuthReady: (authReady) => set({ authReady }),
	reset: () =>
		set({
			user: null,
			status: "unauthenticated",
			isAnonymous: false,
			error: null,
			authReady: true,
		}),
}));
