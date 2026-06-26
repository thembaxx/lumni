"use client";

import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FadeIn } from "@/components/shared/fade-in";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Suspense, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormSkeleton } from "@/components/ui/skeletons";
import { Link, useRouter } from "@/i18n/navigation";

function VerifyEmailContent() {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const [error, setError] = useState("");
  const calledRef = useRef(false);
  const t = useTranslations();

  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async () => {
      if (!userId || !secret) throw new Error("Invalid verification link");
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, secret }),
      });
      if (!res.ok) throw new Error("Verification failed");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (err) => setError(err instanceof Error ? err.message : "Verification failed"),
  });

  if (userId && secret && !calledRef.current) {
    calledRef.current = true;
    mutate();
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="font-heading font-semibold text-2xl">{t("auth.verificationFailed")}</h1>
        <p className="text-muted-foreground text-sm">{error}</p>
        <Link
          href="/auth/sign-in"
          className="font-semibold text-sm text-system-accent hover:underline"
        >
          {t("auth.backToSignIn")}
        </Link>
      </div>
    );
  }

  return (
    <FadeIn direction="up" distance={12} className="flex flex-col items-center gap-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 dark:bg-green-400/10">
        <HugeiconsIcon icon={SparklesIcon} className="size-8 text-green-500 dark:text-green-300" />
      </div>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-semibold text-2xl">{t("auth.emailVerified")}</h1>
        <p className="text-muted-foreground text-sm">{t("auth.emailVerifiedDesc")}</p>
      </div>
      <Button onClick={() => push("/dashboard")} className="rounded-xl">
        {t("auth.goToDashboard")}
      </Button>
    </FadeIn>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
