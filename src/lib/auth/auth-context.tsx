"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Models } from "appwrite";
import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { create } from "zustand";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT, account } from "@/lib/appwrite";
import { flushOfflineData } from "@/lib/sync/sync-handler";
import { processQueue } from "@/lib/sync-queue";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

function getReadableErrorMessage(err: unknown): string {
	const message =
		err instanceof Error ? err.message.toLowerCase() : "Something went wrong";

	if (
		message.includes("already exists") ||
		message.includes("already registered")
	) {
		return "An account with this email already exists. Sign in instead.";
	}
	if (message.includes("invalid credentials")) {
		return "Incorrect email or password. Try again.";
	}
	if (message.includes("user with this email not found")) {
		return "No account found with this email. Create an account instead.";
	}
	if (message.includes("invalid email")) {
		return "Enter a valid email address.";
	}
	if (message.includes("missing") || message.includes("required")) {
		return "Please fill in all required fields.";
	}
	if (message.includes("network") || message.includes("fetch")) {
		return "Couldn't connect. Check your internet connection and try again.";
	}
	if (message.includes("rate") || message.includes("too many")) {
		return "Too many attempts. Please wait a moment and try again.";
	}
	if (message.includes("password") && message.includes("length")) {
		return "Password must be at least 8 characters.";
	}
	if (message.includes("verification") && message.includes("invalid")) {
		return "This verification link has expired or is invalid. Request a new one.";
	}
	if (message.includes("session") && message.includes("expired")) {
		return "Your session expired. Please sign in again.";
	}

	return (
		message.charAt(0).toUpperCase() + message.slice(1) ||
		"Something went wrong. Try again."
	);
}

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

const useAuthStore = create<AuthState>((set) => ({
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

interface AuthContextValue {
	user: Models.User<Models.Preferences> | null;
	status: AuthStatus;
	isAnonymous: boolean;
	error: string | null;
	authReady: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string, name: string) => Promise<void>;
	signInWithMagicLink: (email: string) => Promise<void>;
	signOut: () => Promise<void>;
	verifyEmail: () => Promise<void>;
	updateProfile: (fields: {
		name?: string;
		prefs?: Record<string, unknown>;
	}) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ANONYMOUS_ATTEMPTED_KEY = "lumni_anonymous_attempted";

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const store = useAuthStore();
	const queryClient = useQueryClient();
	const router = useRouter();
	const initRef = useRef(false);

	useEffect(() => {
		if (initRef.current) return;
		initRef.current = true;

		async function init() {
			const alreadyAttempted =
				typeof window !== "undefined" &&
				localStorage.getItem(ANONYMOUS_ATTEMPTED_KEY) === "true";

			try {
				const currentUser = await account.get();
				const isAnon = currentUser.labels?.includes("anonymous") ?? false;
				store.setUser(currentUser, "authenticated", isAnon);
			} catch {
				if (alreadyAttempted) {
					store.setAuthReady(true);
					return;
				}

				try {
					await account.createAnonymousSession();
					const anonUser = await account.get();
					localStorage.setItem(ANONYMOUS_ATTEMPTED_KEY, "true");
					store.setUser(anonUser, "authenticated", true);
				} catch {
					store.setUser(null, "unauthenticated", false);
				}
			} finally {
				store.setAuthReady(true);
			}
		}

		init();
	}, [store.setUser, store.setAuthReady]);

	const signIn = useCallback(
		async (email: string, password: string) => {
			store.setError(null);
			try {
				await account.createEmailPasswordSession(email, password);
				const user = await account.get();
				store.setUser(user, "authenticated", false);
				queryClient.invalidateQueries();
			} catch (err) {
				store.setError(getReadableErrorMessage(err));
				throw err;
			}
		},
		[queryClient, store.setUser, store.setError],
	);

	const signUp = useCallback(
		async (email: string, password: string, name: string) => {
			store.setError(null);
			try {
				await account.updateName(name);
				await account.updateEmail(email, password);
				await account.updatePassword(password);
				const user = await account.get();
				store.setUser(user, "authenticated", false);

				await flushOfflineData(user.$id).catch(() => {});
				await processQueue().catch(() => {});
			} catch (err) {
				store.setError(getReadableErrorMessage(err));
				throw err;
			}
		},
		[store.setUser, store.setError],
	);

	const signInWithMagicLink = useCallback(
		async (email: string) => {
			store.setError(null);
			try {
				const redirectUrl =
					typeof window !== "undefined"
						? `${window.location.origin}/api/auth/callback`
						: `${APPWRITE_ENDPOINT}/auth/magic-link/callback`;

				await account.createMagicURLToken(email, redirectUrl);
			} catch (err) {
				store.setError(getReadableErrorMessage(err));
				throw err;
			}
		},
		[store.setError],
	);

	const signOut = useCallback(async () => {
		try {
			await account.deleteSession("current");
		} catch {
		} finally {
			localStorage.removeItem(ANONYMOUS_ATTEMPTED_KEY);
			store.reset();
			queryClient.clear();
			router.push("/");
			router.refresh();
		}
	}, [queryClient, router, store.reset]);

	const verifyEmail = useCallback(async () => {
		store.setError(null);
		try {
			const redirectUrl =
				typeof window !== "undefined"
					? `${window.location.origin}/settings`
					: "";
			await account.createVerification(redirectUrl);
		} catch (err) {
			store.setError(getReadableErrorMessage(err));
			throw err;
		}
	}, [store.setError]);

	const updateProfile = useCallback(
		async (fields: { name?: string; prefs?: Record<string, unknown> }) => {
			store.setError(null);
			try {
				if (fields.name !== undefined) {
					await account.updateName(fields.name);
				}
				if (fields.prefs !== undefined) {
					await account.updatePrefs(fields.prefs);
				}
				const user = await account.get();
				store.setUser(user, "authenticated", store.isAnonymous);
			} catch (err) {
				store.setError(getReadableErrorMessage(err));
				throw err;
			}
		},
		[store.isAnonymous, store.setUser, store.setError],
	);

	return (
		<AuthContext
			value={{
				user: store.user,
				status: store.status,
				isAnonymous: store.isAnonymous,
				error: store.error,
				authReady: store.authReady,
				signIn,
				signUp,
				signInWithMagicLink,
				signOut,
				verifyEmail,
				updateProfile,
			}}
		>
			{children}
		</AuthContext>
	);
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return ctx;
}
