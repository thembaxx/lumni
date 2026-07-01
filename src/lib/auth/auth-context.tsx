"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type Models, OAuthProvider } from "appwrite";
import { createContext, use, useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { APPWRITE_ENDPOINT, account } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";
import { flushOfflineData } from "@/lib/sync/sync-handler";
import { getReadableErrorMessage } from "./errors";
import { attemptMagicLink, attemptSignIn, recordSuccessfulSignIn } from "./rate-limit";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

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

const ANONYMOUS_ATTEMPTED_KEY = "lumni_anonymous_attempted";

async function syncGoogleAvatar(user: Models.User<Models.Preferences>): Promise<void> {
  try {
    const prefs = user.prefs as Record<string, unknown>;
    if (prefs?.avatarUrl) return;

    const session = await account.getSession("current");
    if (session.provider !== "google" || !session.providerAccessToken) return;

    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${session.providerAccessToken}` },
    });
    if (!res.ok) return;

    const data = (await res.json()) as { picture?: string };
    if (!data.picture) return;

    const freshUser = await account.get();
    const freshPrefs = freshUser.prefs as Record<string, unknown>;
    await account.updatePrefs({ ...freshPrefs, avatarUrl: data.picture });
  } catch (err) {
    logError("sync-google-avatar", err);
  }
}

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
        });
        dispatch({ type: "SET_AUTH_READY", authReady: true });
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
        });
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
          });
        } catch (anonErr) {
          if (cancelled) return;
          logError("auth-anonymous", anonErr);
          localStorage.setItem(ANONYMOUS_ATTEMPTED_KEY, "true");
          dispatch({
            type: "SET_USER",
            user: null,
            status: "unauthenticated",
            isAnonymous: false,
          });
        }
      } finally {
        if (!cancelled) {
          dispatch({ type: "SET_AUTH_READY", authReady: true });
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
      dispatch({ type: "SET_ERROR", error: null });

      const rateLimit = await attemptSignIn(email);
      if (!rateLimit.allowed) {
        dispatch({ type: "SET_ERROR", error: rateLimit.errorMessage });
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
        });
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } catch (err) {
        dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
        throw err;
      }
    },
    [queryClient],
  );

  const signUp = useCallback(async (email: string, password: string, name: string) => {
    dispatch({ type: "SET_ERROR", error: null });
    try {
      await Promise.all([account.updateName(name), account.updateEmail(email, password)]);
      const user = await account.get();
      dispatch({
        type: "SET_USER",
        user,
        status: "authenticated",
        isAnonymous: false,
      });

      await flushOfflineData(user.$id).catch((e) => logError("flush-offline-data", e));
      return user.$id;
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: getReadableErrorMessage(err) });
      throw err;
    }
  }, []);

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

  const signInWithGoogle = useCallback(async () => {
    dispatch({ type: "SET_ERROR", error: null });
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
    }
  }, [queryClient]);

  const verifyEmail = useCallback(async () => {
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const redirectUrl = typeof window !== "undefined" ? `${window.location.origin}/settings` : "";
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
