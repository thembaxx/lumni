"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type Models, OAuthProvider } from "appwrite";
import { createContext, use, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { APPWRITE_ENDPOINT, account } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";
import { flushOfflineData } from "@/lib/sync/sync-handler";
import { getReadableErrorMessage } from "./errors";
import { attemptMagicLink, attemptSignIn, recordSuccessfulSignIn } from "./rate-limit";
import { type AuthAction, authReducer, INITIAL_AUTH_STATE } from "./auth-types";
import { ANONYMOUS_ATTEMPTED_KEY, syncGoogleAvatar } from "./auth-helpers";
import type { AuthStatus } from "./auth-types";

interface AuthContextValue {
  user: Models.User<Models.Preferences> | null;
  status: AuthStatus;
  isAnonymous: boolean;
  error: string | null;
  authReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<string | undefined>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: () => Promise<void>;
  updateProfile: (fields: { name?: string; prefs?: Record<string, unknown> }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH_STATE);
  const queryClient = useQueryClient();
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    const init = async () => {
      if (
        typeof window !== "undefined" &&
        localStorage.getItem(ANONYMOUS_ATTEMPTED_KEY) === "true"
      ) {
        dispatch({
          type: "SET_USER",
          user: null,
          status: "unauthenticated",
          isAnonymous: false,
        } satisfies AuthAction);
        dispatch({ type: "SET_AUTH_READY", authReady: true } satisfies AuthAction);
        return;
      }

      try {
        const currentUser = await account.get();
        if (cancelled) return;
        const isAnon = currentUser.labels?.includes("anonymous") ?? false;
        dispatch({
          type: "SET_USER",
          user: currentUser,
          status: "authenticated",
          isAnonymous: isAnon,
        } satisfies AuthAction);
        if (!isAnon) {
          syncGoogleAvatar(currentUser);
        }
      } catch (err) {
        if (cancelled) return;
        logError("auth-init", err);

        try {
          await account.createAnonymousSession();
          if (cancelled) return;
          const anonUser = await account.get();
          localStorage.setItem(ANONYMOUS_ATTEMPTED_KEY, "true");
          dispatch({
            type: "SET_USER",
            user: anonUser,
            status: "authenticated",
            isAnonymous: true,
          } satisfies AuthAction);
        } catch (anonErr) {
          if (cancelled) return;
          logError("auth-anonymous", anonErr);
          localStorage.setItem(ANONYMOUS_ATTEMPTED_KEY, "true");
          dispatch({
            type: "SET_USER",
            user: null,
            status: "unauthenticated",
            isAnonymous: false,
          } satisfies AuthAction);
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: "SET_AUTH_READY", authReady: true } satisfies AuthAction);
        }
      }
    };

    init().catch((err) => logError("auth-context.init", err));

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      dispatch({ type: "SET_ERROR", error: null } satisfies AuthAction);

      const rateLimit = await attemptSignIn(email);
      if (!rateLimit.allowed) {
        dispatch({ type: "SET_ERROR", error: rateLimit.errorMessage } satisfies AuthAction);
        return;
      }

      try {
        await account.createEmailPasswordSession(email, password);
        const [user] = await Promise.all([account.get(), recordSuccessfulSignIn(email)]);
        dispatch({
          type: "SET_USER",
          user,
          status: "authenticated",
          isAnonymous: false,
        } satisfies AuthAction);
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) } satisfies AuthAction);
        throw err;
      }
    },
    [queryClient],
  );

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    dispatch({ type: "SET_ERROR", error: null } satisfies AuthAction);
    try {
      await Promise.all([account.updateName(name), account.updateEmail(email, password)]);
      const user = await account.get();
      dispatch({
        type: "SET_USER",
        user,
        status: "authenticated",
        isAnonymous: false,
      } satisfies AuthAction);

      await flushOfflineData(user.$id).catch((e) => logError("flush-offline-data", e));
      return user.$id;
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) } satisfies AuthAction);
      throw err;
    }
  }, []);

  const signInWithMagicLink = useCallback(async (email: string) => {
    dispatch({ type: "SET_ERROR", error: null } satisfies AuthAction);

    const rateLimit = await attemptMagicLink(email);
    if (!rateLimit.allowed) {
      dispatch({ type: "SET_ERROR", error: rateLimit.errorMessage } satisfies AuthAction);
      return;
    }

    try {
      const redirectUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/api/auth/callback`
          : `${APPWRITE_ENDPOINT}/auth/magic-link/callback`;

      await account.createMagicURLToken(email, redirectUrl);
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) } satisfies AuthAction);
      throw err;
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: "SET_ERROR", error: null } satisfies AuthAction);
    try {
      const successUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/dashboard?auth=success`
          : "/dashboard?auth=success";
      const failureUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/auth/sign-in?error=oauth_failed`
          : "/auth/sign-in?error=oauth_failed";

      account.createOAuth2Session({
        provider: OAuthProvider.Google,
        success: successUrl,
        failure: failureUrl,
      });
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) } satisfies AuthAction);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await account.deleteSession("current");
    } catch (err) {
      logError("AuthContext.signOut", err);
    } finally {
      localStorage.removeItem(ANONYMOUS_ATTEMPTED_KEY);
      dispatch({ type: "RESET" } satisfies AuthAction);
      queryClient.clear();
    }
  }, [queryClient]);

  const verifyEmail = useCallback(async () => {
    dispatch({ type: "SET_ERROR", error: null } satisfies AuthAction);
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/settings` : "";
      await account.createVerification(redirectUrl);
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) } satisfies AuthAction);
      throw err;
    }
  }, []);

  const updateProfile = useCallback(
    async (fields: { name?: string; prefs?: Record<string, unknown> }) => {
      dispatch({ type: "SET_ERROR", error: null } satisfies AuthAction);
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
        } satisfies AuthAction);
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) } satisfies AuthAction);
        throw err;
      }
    },
    [state.isAnonymous],
  );

  const value = useMemo(
    () => ({
      user: state.user,
      status: state.status,
      isAnonymous: state.isAnonymous,
      error: state.error,
      authReady: state.authReady,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      verifyEmail,
      updateProfile,
    }),
    [
      state.user,
      state.status,
      state.isAnonymous,
      state.error,
      state.authReady,
      signIn,
      signUp,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      verifyEmail,
      updateProfile,
    ],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth(): AuthContextValue {
  const ctx = use(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
