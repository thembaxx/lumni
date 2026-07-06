"use client";

import Alert01Icon from "@hugeicons/core-free-icons/Alert01Icon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-(--system-background) p-6" suppressHydrationWarning>
        <div className="grid min-h-dvh grid-cols-12 gap-0">
          <div className="col-span-12 col-start-1 flex items-center justify-center p-4 md:col-span-7">
            <main className="flex max-w-md flex-col gap-8 text-left">
              <div className="relative">
                <div className="absolute inset-0 animate-pulse rounded-full bg-destructive/10 blur-xl" />
                <div className="relative flex size-20 items-center justify-center rounded-(--radius-card) border border-destructive/20 bg-destructive/10">
                  <HugeiconsIcon icon={Alert01Icon} className="size-10 text-destructive" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <h2 className="ios-title-2 text-(--system-text-primary)">Something went wrong</h2>
                <p className="ios-callout text-(--system-text-secondary)">
                  {error?.message ||
                    "Something went wrong. This might be a network issue or a temporary glitch. Try again or go back to the dashboard."}
                </p>
                {error?.digest && (
                  <p className="ios-footnote font-mono text-muted-foreground">
                    Error ID: {error.digest}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button variant="outline" onClick={() => reset()} className="gap-2">
                  <HugeiconsIcon icon={RefreshIcon} className="size-4" />
                  Try again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/")}
                  className="gap-2"
                >
                  <HugeiconsIcon icon={Home01Icon} className="size-4" />
                  Go Home
                </Button>
              </div>

              <p className="ios-footnote text-muted-foreground">
                If this persists, please contact support.
              </p>
            </main>
          </div>

          <div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 hidden md:block md:col-span-5 md:col-start-8">
            <div className="absolute inset-0 bg-linear-to-br from-destructive/5 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-destructive/10 blur-2xl" />
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
