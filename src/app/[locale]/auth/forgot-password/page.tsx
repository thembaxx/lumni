"use client";

import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";

export default function ForgotPasswordPage() {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      // swallow — show success regardless (no user enumeration)
    }
    setSent(true);
  };

  if (sent) {
    return (
      <FadeIn direction="up" distance={12} className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-system-accent/10">
          <HugeiconsIcon icon={SparklesIcon} className="size-8 text-system-accent" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-semibold text-2xl">{t("auth.checkEmail")}</h1>
          <p className="text-muted-foreground text-sm">
            {t.rich("auth.resetEmailSent", {
              email,
              // oxlint-disable-next-line react/no-unstable-nested-components — t.rich formatter callback, not a React component
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
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

  return (
    <FadeIn direction="up" distance={12}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-semibold text-2xl">{t("auth.resetPassword")}</h1>
          <p className="text-muted-foreground text-sm">{t("auth.resetPasswordSubtitle")}</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="font-semibold text-sm">
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
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl bg-system-surface pl-10"
            />
          </div>
        </div>

        <Button type="submit" disabled={!email} className="h-11 w-full rounded-xl">
          {t("auth.sendResetLink")}
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
