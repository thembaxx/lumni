"use client";

import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useCallback, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Link, useRouter } from "@/i18n/navigation";
import { logError } from "@/lib/shared/logger";
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

  const doSignIn = useCallback(async () => {
    if (isMagicLink) {
      await signInWithMagicLink(email);
      dispatch({ type: "MAGIC_LINK_SENT" });
    } else {
      await signIn(email, password);
      push(redirect);
      refresh();
    }
  }, [email, password, isMagicLink, signIn, signInWithMagicLink, push, redirect, refresh]);

  const handleSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await doSignIn();
      } catch (e) {
        logError("sign-in", e);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [doSignIn],
  );

  if (magicLinkSent) {
    return (
      <Card variant="hero" className="mx-auto w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-lg bg-(--accent-gold)">
          <HugeiconsIcon icon={SparklesIcon} className="size-8 text-(--fg)" />
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">{t("auth.checkEmail")}</CardTitle>
          <CardDescription className="text-sm text-(--fg-muted)">
            {t.rich("auth.magicLinkSent", {
              email,
              strong: (chunks) => <strong className="text-(--fg)">{chunks}</strong>,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: "RESET_MAGIC_LINK" })}
            className="w-full"
          >
            {t("auth.useDifferentEmail")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="hero" className="mx-auto w-full max-w-md p-8">
      <CardHeader className="mb-6 p-0">
        <CardTitle className="text-2xl font-extrabold">{t("auth.signInTitle")}</CardTitle>
        <CardDescription className="text-sm text-(--fg-muted)">
          {t("auth.welcomeBack")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSignIn} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="font-body font-bold text-xs uppercase tracking-wider text-(--fg)"
          >
            {t("auth.emailLabel")}
          </label>
          <div className="relative">
            <HugeiconsIcon
              icon={Mail01Icon}
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-(--fg-muted)"
            />
            <Input
              id="email"
              type="email"
              placeholder={t("auth.emailPlaceholder")}
              value={email}
              onChange={(e) => dispatch({ type: "SET_EMAIL", payload: e.target.value })}
              required
              className="pl-10"
            />
          </div>
        </div>

        {!isMagicLink && (
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="font-body font-bold text-xs uppercase tracking-wider text-(--fg)"
            >
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
                className="pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-(--fg-muted) hover:text-(--fg)"
              >
                <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} className="size-4" />
              </button>
            </div>
            <div className="flex justify-end mt-1">
              <Link
                href="/auth/forgot-password"
                className="font-body text-xs text-(--fg-muted) hover:underline"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>
          </div>
        )}

        {(error || oauthError) && (
          <p className="font-body text-xs font-bold text-(--accent-red)">
            {error ||
              (oauthError === "oauth_failed"
                ? "Google sign-in failed. Please try again."
                : "Something went wrong. Please try again.")}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading || !email}
          variant="primary"
          size="lg"
          className="w-full mt-2"
        >
          {loading ? t("auth.signingIn") : isMagicLink ? t("auth.sendMagicLink") : t("auth.signIn")}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-(--border-soft)" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-(--bg) px-2 text-(--fg-muted) font-semibold">
              {t("auth.orContinueWith")}
            </span>
          </div>
        </div>

        <Button
          type="button"
          disabled={googleLoading}
          variant="outline"
          onClick={async () => {
            setGoogleLoading(true);
            try {
              await signInWithGoogle();
            } catch {
              setGoogleLoading(false);
            }
          }}
          className="w-full"
        >
          {googleLoading ? t("auth.signingIn") : t("auth.signInWithGoogle")}
        </Button>

        <button
          type="button"
          onClick={() => {
            dispatch({ type: "TOGGLE_MAGIC_LINK" });
            dispatch({ type: "SET_PASSWORD", payload: "" });
          }}
          className="mt-2 text-center font-body text-xs font-bold text-(--fg) hover:underline"
        >
          {isMagicLink ? t("auth.signInWithPassword") : t("auth.sendMagicLinkLabel")}
        </button>

        <p className="mt-4 text-center font-body text-xs text-(--fg-muted)">
          {t("auth.noAccount")}{" "}
          <Link
            href={`/auth/sign-up?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-(--fg) underline"
          >
            {t("auth.signUp")}
          </Link>
        </p>
      </form>
    </Card>
  );
}
