import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = {
  title: "Offline - Lumni",
};

export const instant = false;

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background py-6 text-center">
      <PageContainer className="gap-4">
        <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-muted">
          <svg
            className="size-10 text-muted-foreground"
            role="img"
            aria-labelledby="offline-icon-title"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <title id="offline-icon-title">Offline status icon</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m0 0a9 9 0 00-9 9m9-9v18"
            />
          </svg>
        </div>
        <h1 className="font-semibold text-2xl">You&apos;re offline</h1>
        <p className="text-muted-foreground text-sm">
          Don&apos;t worry - your saved progress and cached questions are available. Results will
          sync when you reconnect.
        </p>
        <div className="flex flex-col gap-2 pt-4">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-6 font-semibold text-background text-sm"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/quiz"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 font-semibold text-sm"
          >
            Continue Studying
          </Link>
        </div>
      </PageContainer>
    </div>
  );
}
