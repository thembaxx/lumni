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
} from "react";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT, account } from "@/lib/appwrite";
import { flushOfflineData } from "@/lib/sync/sync-handler";
import { processQueue } from "@/lib/sync-queue";
import { useAuthStore } from "@/store/auth";
import { getReadableErrorMessage } from "./errors";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

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
				queryClient.invalidateQueries({ queryKey: ["user"] });
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
