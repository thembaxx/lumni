"use client";

import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import ViewOffIcon from "@hugeicons/core-free-icons/ViewOffIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormSkeleton } from "@/components/ui/skeletons";
import { Link } from "@/i18n/navigation";

type ResetPasswordState = {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  error: string;
  loading: boolean;
  success: boolean;
};

type ResetPasswordAction =
  | { type: "SET_PASSWORD"; password: string }
  | { type: "SET_CONFIRM_PASSWORD"; confirmPassword: string }
  | { type: "TOGGLE_SHOW_PASSWORD" }
  | { type: "SET_ERROR"; error: string }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_SUCCESS" };

function reducer(state: ResetPasswordState, action: ResetPasswordAction): ResetPasswordState {
  switch (action.type) {
    case "SET_PASSWORD":
      return { ...state, password: action.password };
    case "SET_CONFIRM_PASSWORD":
      return { ...state, confirmPassword: action.confirmPassword };
    case "TOGGLE_SHOW_PASSWORD":
      return { ...state, showPassword: !state.showPassword };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_SUCCESS":
      return { ...state, success: true, loading: false };
    default:
      return state;
  }
}

const initialState: ResetPasswordState = {
  password: "",
  confirmPassword: "",
  showPassword: false,
  error: "",
  loading: false,
  success: false,
};

function Form() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: "SET_ERROR", error: "" });

    if (state.password.length < 8) {
      dispatch({ type: "SET_ERROR", error: t("auth.passwordTooShort") });
      return;
    }
    if (state.password !== state.confirmPassword) {
      dispatch({ type: "SET_ERROR", error: t("auth.passwordsDoNotMatch") });
      return;
    }

    dispatch({ type: "SET_LOADING", loading: true });

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret, password: state.password }),
      });

      if (!res.ok) {
        const data = await res.json();
        dispatch({ type: "SET_ERROR", error: data.error || t("auth.resetFailed") });
        return;
      }

      dispatch({ type: "SET_SUCCESS" });
    } catch {
      dispatch({ type: "SET_ERROR", error: t("auth.networkError") });
    }
  };

  if (state.success) {
    return (
      <FadeIn direction="up" distance={12} className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-semibold text-2xl">{t("auth.passwordResetSuccess")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.passwordResetSuccessSubtitle")}</p>
        </div>
        <Link
          href="/auth/sign-in"
          className="font-semibold text-sm text-system-accent hover:underline"
        >
          {t("auth.backToSignIn")}
        </Link>
      </FadeIn>
    );
  }

  if (!userId || !secret) {
    return (
      <FadeIn direction="up" distance={12} className="flex flex-col items-center gap-6 text-center">
        <h1 className="font-heading font-semibold text-2xl">{t("auth.invalidResetLink")}</h1>
        <p className="text-muted-foreground text-sm">{t("auth.invalidResetLinkDesc")}</p>
        <Link
          href="/auth/forgot-password"
          className="font-semibold text-sm text-system-accent hover:underline"
        >
          {t("auth.requestNewResetLink")}
        </Link>
      </FadeIn>
    );
  }

  return (
    <FadeIn direction="up" distance={12}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-semibold text-2xl">{t("auth.resetPassword")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.enterNewPassword")}</p>
        </div>

        {state.error && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="font-semibold text-sm">
            {t("auth.newPassword")}
          </label>
          <div className="relative">
            <Input
              id="password"
              type={state.showPassword ? "text" : "password"}
              placeholder={t("auth.passwordPlaceholder")}
              value={state.password}
              onChange={(e) => dispatch({ type: "SET_PASSWORD", password: e.target.value })}
              required
              minLength={8}
              className="h-11 rounded-xl bg-system-surface pr-10 pl-4"
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_SHOW_PASSWORD" })}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={state.showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
            >
              <HugeiconsIcon
                icon={state.showPassword ? ViewOffIcon : ViewIcon}
                className="size-4"
                data-icon
              />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="font-semibold text-sm">
            {t("auth.confirmPassword")}
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder={t("auth.confirmPasswordPlaceholder")}
            value={state.confirmPassword}
            onChange={(e) =>
              dispatch({ type: "SET_CONFIRM_PASSWORD", confirmPassword: e.target.value })
            }
            required
            minLength={8}
            className="h-11 rounded-xl bg-system-surface px-4"
          />
        </div>

        <Button type="submit" disabled={state.loading} className="h-11 w-full rounded-xl">
          {state.loading ? t("auth.resetting") : t("auth.resetPasswordButton")}
        </Button>

        <p className="text-center text-muted-foreground text-sm">
          {t("auth.rememberPassword")}{" "}
          <Link href="/auth/sign-in" className="font-semibold text-system-accent hover:underline">
            {t("auth.signIn")}
          </Link>
        </p>
      </form>
    </FadeIn>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Form />
    </Suspense>
  );
}
