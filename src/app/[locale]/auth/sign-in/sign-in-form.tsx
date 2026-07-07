"use client";

import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";

function safeRedirect(url: string | null): string {
  if (!url) return "/dashboard";
  if (!url.startsWith("/") || url.startsWith("//")) return "/dashboard";
  if (url.includes("://") || url.includes("@")) return "/dashboard";
  return url;
}

type SignInState = {
  email: string;
  password: string;
  showPassword: boolean;
  isMagicLink: boolean;
  magicLinkSent: boolean;
  loading: boolean;
};

type SignInAction =
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "TOGGLE_SHOW_PASSWORD" }
  | { type: "TOGGLE_MAGIC_LINK" }
  | { type: "MAGIC_LINK_SENT" }
  | { type: "RESET_MAGIC_LINK" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: SignInState = {
  email: "",
  password: "",
  showPassword: false,
  isMagicLink: false,
  magicLinkSent: false,
  loading: false,
};

function signInReducer(state: SignInState, action: SignInAction): SignInState {
  switch (action.type) {
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "TOGGLE_SHOW_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "TOGGLE_MAGIC_LINK":
      return { ...state, isMagicLink: !state.isMagicLink };
    case "MAGIC_LINK_SENT":
      return { ...state, magicLinkSent: true };
    case "RESET_MAGIC_LINK":
      return { ...state, magicLinkSent: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export function SignInForm() {
  const { push, refresh } = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const oauthError = searchParams.get("error");
  const { signIn, signInWithMagicLink, signInWithGoogle, error } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [state, dispatch] = useReducer(signInReducer, initialState);
  const { email, password, showPassword, isMagicLink, magicLinkSent, loading } = state;
  const t = useTranslations();

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        if (isMagicLink) {
          await signInWithMagicLink(email);
          dispatch({ type: "MAGIC_LINK_SENT" });
        } else {
          await signIn(email, password);
          push(redirect);
          refresh();
        }
      } catch {
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [email, password, isMagicLink, signIn, signInWithMagicLink, push, redirect, refresh],
  );

  if (magicLinkSent) {
    return (
      <FadeIn direction="up" distance={12} className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-system-accent/10">
          <HugeiconsIcon icon={SparklesIcon} className="size-8 text-system-accent" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="ios-title-2 font-semibold text-foreground">{t("auth.checkEmail")}</h1>
          <p className="ios-subhead text-muted-foreground leading-relaxed">
            {t.rich("auth.magicLinkSent", {
              email,
              // oxlint-disable-next-line react/no-unstable-nested-components — t.rich formatter callback, not a React component
              strong: (chunks) => <strong className="text-foreground">{chunks}</strong>,
            })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch({ type: "RESET_MAGIC_LINK" })}
          className="font-semibold text-sm text-system-accent hover:underline"
        >
          {t("auth.useDifferentEmail")}
        </button>
      </FadeIn>
    );
  }

  return (
    <FadeIn direction="up" distance={12}>
      <form onSubmit={handleSignIn} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="ios-title-2 font-semibold text-foreground">{t("auth.signInTitle")}</h1>
          <p className="ios-subhead text-muted-foreground">{t("auth.welcomeBack")}</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="ios-footnote font-semibold text-foreground">
              {t("auth.emailLabel")}
            </label>
            <div className="relative">
              <HugeiconsIcon
                icon={Mail01Icon}
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id="email"
                type="email"
                placeholder={t("auth.emailPlaceholder")}
                value={email}
                onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
                required
                className="h-11 rounded-xl border-border/40 bg-system-surface pl-10"
              />
            </div>
          </div>

          {!isMagicLink && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="ios-footnote font-semibold text-foreground">
                {t("auth.passwordLabel")}
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.passwordPlaceholder")}
                  value={password}
                  onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
                  required
                  className="h-11 rounded-xl border-border/40 bg-system-surface pr-10"
                />
                <button
                  type="button"
                  aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                  onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-transform duration-150 hover:text-foreground active:scale-[0.96]"
                >
                  {showPassword ? (
                    <HugeiconsIcon icon={ViewOffIcon} className="size-4" />
                  ) : (
                    <HugeiconsIcon icon={ViewIcon} className="size-4" />
                  )}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="font-medium text-sm text-system-accent hover:underline"
                >
                  {t("auth.forgotPassword")}
                </Link>
              </div>
            </div>
          )}

          {(error || oauthError) && (
            <p className="ios-footnote font-medium text-destructive">
              {error ||
                (oauthError === "oauth_failed"
                  ? "Google sign-in failed. Please try again."
                  : "Something went wrong. Please try again.")}
            </p>
          )}

          <div className="flex flex-col gap-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-border/40 border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-system-surface px-2 text-muted-foreground">
                  {t("auth.orContinueWith")}
                </span>
              </div>
            </div>
            <Button
              type="button"
              disabled={googleLoading}
              onClick={async () => {
                setGoogleLoading(true);
                try {
                  await signInWithGoogle();
                } catch {
                  setGoogleLoading(false);
                }
              }}
              className="h-11 w-full rounded-xl border border-border/40 bg-system-surface font-semibold text-foreground text-sm transition-[background-color,transform] hover:bg-system-surface/80 active:scale-[0.96]"
            >
              {googleLoading ? (
                <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              ) : (
                <svg className="mr-2 size-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {googleLoading ? t("auth.signingIn") : t("auth.signInWithGoogle")}
            </Button>
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="h-11 w-full rounded-xl bg-system-accent font-semibold text-sm text-system-accent-foreground transition-[background-color,transform] hover:bg-system-accent/90 active:scale-[0.96]"
          >
            {loading
              ? t("auth.signingIn")
              : isMagicLink
                ? t("auth.sendMagicLink")
                : t("auth.signIn")}
          </Button>

          <button
            type="button"
            onClick={() => {
              dispatch({ type: "TOGGLE_MAGIC_LINK" });
              dispatch({ type: "SET_PASSWORD", payload: "" });
            }}
            className="text-center font-medium text-sm text-system-accent hover:underline"
          >
            {isMagicLink ? t("auth.signInWithPassword") : t("auth.sendMagicLinkLabel")}
          </button>
        </div>

        <p className="text-center text-muted-foreground text-sm">
          {t("auth.noAccount")}{" "}
          <Link
            href={`/auth/sign-up?redirect=${encodeURIComponent(redirect)}`}
            className="font-semibold text-system-accent hover:underline"
          >
            {t("auth.signUp")}
          </Link>
        </p>
      </form>
    </FadeIn>
  );
}
