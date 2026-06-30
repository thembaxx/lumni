"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BoltErrorStateProps {
  onRetry: () => void;
  onClose: () => void;
  isRetrying: boolean;
}

export function BoltErrorState({ onRetry, onClose, isRetrying }: BoltErrorStateProps) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <div className="relative flex size-16 items-center justify-center rounded-3xl bg-destructive/10 ring-1 ring-destructive/20">
        <div className="absolute inset-0 rounded-3xl bg-destructive/20 blur-xl" />
        <HugeiconsIcon
          icon={AlertCircleIcon}
          className="relative size-7 text-destructive"
          strokeWidth={2}
        />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="ios-title-3 text-balance text-foreground">
          We couldn&rsquo;t load your challenge
        </h2>
        <p className="max-w-sm text-balance text-muted-foreground text-sm">
          Something tripped while loading today&rsquo;s question. Give it another try, or close and
          pick a different start.
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
          {isRetrying ? "Retrying\u2026" : "Try again"}
        </Button>
      </div>
    </div>
  );
}
