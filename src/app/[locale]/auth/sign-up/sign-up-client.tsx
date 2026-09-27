"use client";

import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useReducer, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FormSkeleton } from "@/components/ui/skeletons";
import { toast } from "@/hooks/use-toast";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { logError } from "@/lib/shared/logger";

function safeRedirect(url: string | null): string {
  if (!url) return "/dashboard";
  if (!url.startsWith("/") || url.startsWith("//")) return "/dashboard";
  if (url.includes("://") || url.includes("@")) return "/dashboard";
  return url;
}

type SignUpState = {
  name: string;
  email: string;
  password: string;
  showPassword: boolean;
  loading: boolean;
};

type SignUpAction =
  | { type: "SET_NAME"; payload: string }
  | { type: "SET_EMAIL"; payload: string }
  | { type: "SET_PASSWORD"; payload: string }
  | { type: "TOGGLE_SHOW_PASSWORD" }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: SignUpState = {
  name: "",
  email: "",
  password: "",
  showPassword: false,
  loading: false,
};

function signUpReducer(state: SignUpState, action: SignUpAction): SignUpState {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_EMAIL":
      return { ...state, email: action.payload };
    case "SET_PASSWORD":
      return { ...state, password: action.payload };
    case "TOGGLE_SHOW_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

function SignUpForm() {
  const { push, refresh } = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));
  const oauthError = searchParams.get("error");
  const { signUp, signInWithGoogle, error } = useAuth();

  const [googleLoading, setGoogleLoading] = useState(false);
  const [state, dispatch] = useReducer(signUpReducer, initialState);
  const { name, email, password, showPassword, loading } = state;
  const t = useTranslations();

  const referralCode = searchParams.get("ref");

  const doSignUp = useCallback(async () => {
    const userId = await signUp(email, password, name);
    if (referralCode && userId) {
      fetch("/api/referral/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralCode, refereeId: userId }),
      }).catch((e) => {
        logError("referral-claim", e);
        toast({
          type: "warning",
          message: "Couldn't apply referral. You can add it later in Settings.",
        });
      });
    }
    push(redirect);
    refresh();
  }, [email, password, name, signUp, push, redirect, referralCode, refresh]);

  const handleSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        await doSignUp();
      } catch (e) {
        logError("sign-up", e);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    },
    [doSignUp],
  );

  return (
    <Card variant="hero" className="mx-auto w-full max-w-md p-8">
      <CardHeader className="mb-6 p-0">
        <CardTitle className="text-2xl font-extrabold">{t("auth.createAccount")}</CardTitle>
        <CardDescription className="text-sm text-(--fg-muted)">
          {t("auth.signUpSubtitle")}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSignUp} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="font-body font-bold text-xs uppercase tracking-wider text-(--fg)">
            {t("auth.displayNameLabel")}
          </label>
          <div className="relative">
            <HugeiconsIcon
              icon={UserIcon}
              className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-(--fg-muted)"
            />
            <Input
              id="name"
              type="text"
              placeholder={t("auth.displayNamePlaceholder")}
              value={name}
              onChange={(e) => dispatch({ type: "SET_NAME", payload: e.target.value })}
              required
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-body font-bold text-xs uppercase tracking-wider text-(--fg)">
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

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-body font-bold text-xs uppercase tracking-wider text-(--fg)">
            {t("auth.passwordLabel")}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("auth.createPassword")}
              value={password}
              onChange={(e) => dispatch({ type: "SET_PASSWORD", payload: e.target.value })}
              required
              minLength={8}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
              aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-(--fg-muted) hover:text-(--fg)"
            >
              <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} className="size-4" />
            </button>
          </div>
          <p className="font-body text-xs text-(--fg-muted) mt-1">{t("auth.passwordHint")}</p>
        </div>

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
          disabled={loading || !name || !email || !password || password.length < 8}
          variant="primary"
          size="lg"
          className="w-full mt-2"
        >
          {loading ? t("auth.creatingAccount") : t("auth.createAccount")}
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
          {googleLoading ? t("common.loading") : t("auth.signInWithGoogle")}
        </Button>

        <p className="mt-4 text-center font-body text-xs text-(--fg-muted)">
          {t("auth.hasAccount")}{" "}
          <Link
            href={`/auth/sign-in?redirect=${encodeURIComponent(redirect)}`}
            className="font-bold text-(--fg) underline"
          >
            {t("auth.signIn")}
          </Link>
        </p>
      </form>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <SignUpForm />
    </Suspense>
  );
}
