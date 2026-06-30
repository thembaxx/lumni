"use client";

import BookOpenIcon from "@hugeicons/core-free-icons/BookOpen01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BoltEmptyStateProps {
  subjectLabel: string;
  onRetry: () => void;
  onClose: () => void;
  isRetrying: boolean;
}

export function BoltEmptyState({
  subjectLabel,
  onRetry,
  onClose,
  isRetrying,
}: BoltEmptyStateProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="relative flex size-16 items-center justify-center rounded-3xl bg-system-fill ring-1 ring-system-separator">
        <HugeiconsIcon
          icon={BookOpenIcon}
          className="relative size-7 text-muted-foreground"
          strokeWidth={2}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="ios-title-3 text-balance text-foreground">
          No {subjectLabel} question ready yet
        </h2>
        <p className="max-w-sm text-balance text-muted-foreground text-sm">
          We couldn&rsquo;t pull a fresh question for you right now. Try again in a moment, or close
          and browse your topics.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto"
          disabled={isRetrying}
        >
          Close
        </Button>
        <Button onClick={onRetry} className="w-full gap-2 sm:w-auto" disabled={isRetrying}>
          <HugeiconsIcon
            icon={RefreshIcon}
            className={cn("size-4", isRetrying && "animate-spin")}
          />
          {isRetrying ? "Refreshing\u2026" : "Refresh Question"}
        </Button>
      </div>
    </div>
  );
}
