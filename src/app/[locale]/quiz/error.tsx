"use client";

import { useTranslations } from "next-intl";

export default function QuizError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8">
      <h2 className="font-semibold text-xl">{t("quiz.errorTitle")}</h2>
      <p className="max-w-md text-center text-muted-foreground text-sm">
        {error?.message || t("quiz.errorDesc")}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-system-accent px-4 py-2 font-semibold text-sm text-system-accent-foreground hover:bg-system-accent/90"
      >
        {t("common.retry")}
      </button>
    </div>
  );
}
