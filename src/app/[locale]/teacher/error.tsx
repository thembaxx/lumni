"use client";

import Alert01Icon from "@hugeicons/core-free-icons/Alert01Icon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function TeacherError({
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
    <div className="grid min-h-dvh place-items-center bg-system-grouped p-6">
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        <div className="flex size-20 items-center justify-center rounded-card-lg border border-destructive/20 bg-destructive/10">
          <HugeiconsIcon icon={Alert01Icon} className="size-10 text-destructive" />
        </div>
        <div>
          <h1 className="ios-title-2 text-foreground">Teacher unavailable</h1>
          <p className="ios-callout mt-1 text-muted-foreground">
            Couldn&apos;t load teacher dashboard. Please try again.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={reset}>
            <HugeiconsIcon icon={RefreshIcon} className="size-4" data-icon="inline-start" />
            Try again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            <HugeiconsIcon icon={Home01Icon} className="size-4" data-icon="inline-start" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}
