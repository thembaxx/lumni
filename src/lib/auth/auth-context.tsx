"use client";

import { useQueryClient } from "@tanstack/react-query";
import type { Models } from "appwrite";
import { useRouter } from "next/navigation";
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useReducer,
	useRef,
} from "react";
import { APPWRITE_ENDPOINT, account } from "@/lib/appwrite";
import { flushOfflineData } from "@/lib/sync/sync-handler";
import { getReadableErrorMessage } from "./errors";
import {
	attemptMagicLink,
	attemptSignIn,
	recordSuccessfulSignIn,
} from "./rate-limit";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
	user: Models.User<Models.Preferences> | null;
	status: AuthStatus;
	isAnonymous: boolean;
	error: string | null;
	authReady: boolean;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (
		email: string,
		password: string,
		name: string,
	) => Promise<string | undefined>;
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

interface AuthState {
	user: Models.User<Models.Preferences> | null;
	status: AuthStatus;
	isAnonymous: boolean;
	error: string | null;
	authReady: boolean;
}

type AuthAction =
	| {
			type: "SET_USER";
			user: Models.User<Models.Preferences> | null;
			status: AuthStatus;
			isAnonymous: boolean;
	  }
	| { type: "SET_ERROR"; error: string | null }
	| { type: "SET_AUTH_READY"; authReady: boolean }
	| { type: "RESET" };

function authReducer(state: AuthState, action: AuthAction): AuthState {
	switch (action.type) {
		case "SET_USER":
			return {
				...state,
				user: action.user,
				status: action.status,
				isAnonymous: action.isAnonymous,
				error: null,
			};
		case "SET_ERROR":
			return { ...state, error: action.error };
		case "SET_AUTH_READY":
			return { ...state, authReady: action.authReady };
		case "RESET":
			return {
				user: null,
				status: "unauthenticated",
				isAnonymous: false,
				error: null,
				authReady: true,
			};
	}
}

const INITIAL_AUTH_STATE: AuthState = {
	user: null,
	status: "loading",
	isAnonymous: false,
	error: null,
	authReady: false,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH_STATE);
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
				dispatch({
					type: "SET_USER",
					user: currentUser,
					status: "authenticated",
					isAnonymous: isAnon,
				});
			} catch {
				if (alreadyAttempted) {
					dispatch({ type: "SET_AUTH_READY", authReady: true });
					return;
				}

				try {
					await account.createAnonymousSession();
					const anonUser = await account.get();
					localStorage.setItem(ANONYMOUS_ATTEMPTED_KEY, "true");
					dispatch({
						type: "SET_USER",
						user: anonUser,
						status: "authenticated",
						isAnonymous: true,
					});
				} catch {
					dispatch({
						type: "SET_USER",
						user: null,
						status: "unauthenticated",
						isAnonymous: false,
					});
				}
			} finally {
				dispatch({ type: "SET_AUTH_READY", authReady: true });
			}
		}

		init();
	}, []);

	const signIn = useCallback(
		async (email: string, password: string) => {
			dispatch({ type: "SET_ERROR", error: null });

			const rateLimit = await attemptSignIn(email);
			if (!rateLimit.allowed) {
				dispatch({ type: "SET_ERROR", error: rateLimit.errorMessage });
				return;
			}

			try {
				await account.createEmailPasswordSession(email, password);
				const user = await account.get();
				await recordSuccessfulSignIn(email);
				dispatch({
					type: "SET_USER",
					user,
					status: "authenticated",
					isAnonymous: false,
				});
				queryClient.invalidateQueries({ queryKey: ["user"] });
			} catch (err) {
				dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
				throw err;
			}
		},
		[queryClient],
	);

	const signUp = useCallback(
		async (email: string, password: string, name: string) => {
			dispatch({ type: "SET_ERROR", error: null });
			try {
				await account.updateName(name);
				await account.updateEmail(email, password);
				const user = await account.get();
				dispatch({
					type: "SET_USER",
					user,
					status: "authenticated",
					isAnonymous: false,
				});

				await flushOfflineData(user.$id).catch((e) =>
					console.warn("Flush offline data:", e),
				);
				return user.$id;
			} catch (err) {
				dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
				throw err;
			}
		},
		[],
	);

	const signInWithMagicLink = useCallback(async (email: string) => {
		dispatch({ type: "SET_ERROR", error: null });

		const rateLimit = await attemptMagicLink(email);
		if (!rateLimit.allowed) {
			dispatch({ type: "SET_ERROR", error: rateLimit.errorMessage });
			return;
		}

		try {
			const redirectUrl =
				typeof window !== "undefined"
					? `${window.location.origin}/api/auth/callback`
					: `${APPWRITE_ENDPOINT}/auth/magic-link/callback`;

			await account.createMagicURLToken(email, redirectUrl);
		} catch (err) {
			dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
			throw err;
		}
	}, []);

	const signOut = useCallback(async () => {
		try {
			await account.deleteSession("current");
		} catch {
		} finally {
			localStorage.removeItem(ANONYMOUS_ATTEMPTED_KEY);
			dispatch({ type: "RESET" });
			queryClient.clear();
			router.push("/");
			router.refresh();
		}
	}, [queryClient, router]);

	const verifyEmail = useCallback(async () => {
		dispatch({ type: "SET_ERROR", error: null });
		try {
			const redirectUrl =
				typeof window !== "undefined"
					? `${window.location.origin}/settings`
					: "";
			await account.createVerification(redirectUrl);
		} catch (err) {
			dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
			throw err;
		}
	}, []);

	const updateProfile = useCallback(
		async (fields: { name?: string; prefs?: Record<string, unknown> }) => {
			dispatch({ type: "SET_ERROR", error: null });
			try {
				if (fields.name !== undefined) {
					await account.updateName(fields.name);
				}
				if (fields.prefs !== undefined) {
					await account.updatePrefs(fields.prefs);
				}
				const user = await account.get();
				dispatch({
					type: "SET_USER",
					user,
					status: "authenticated",
					isAnonymous: state.isAnonymous,
				});
			} catch (err) {
				dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
				throw err;
			}
		},
		[state.isAnonymous],
	);

	return (
		<AuthContext
			value={{
				user: state.user,
				status: state.status,
				isAnonymous: state.isAnonymous,
				error: state.error,
				authReady: state.authReady,
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
