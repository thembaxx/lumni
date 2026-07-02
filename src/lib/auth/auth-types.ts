import { type Models } from "appwrite";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export interface AuthState {
  user: Models.User<Models.Preferences> | null;
  status: AuthStatus;
  isAnonymous: boolean;
  error: string | null;
  authReady: boolean;
}

export type AuthAction =
  | {
      type: "SET_USER";
      user: Models.User<Models.Preferences> | null;
      status: AuthStatus;
      isAnonymous: boolean;
    }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_AUTH_READY"; authReady: boolean }
  | { type: "RESET" };

export function authReducer(state: AuthState, action: AuthAction): AuthState {
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

export const INITIAL_AUTH_STATE: AuthState = {
  user: null,
  status: "loading",
  isAnonymous: false,
  error: null,
  authReady: false,
};
