"use client";

import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { buttonStyles, countdownStyles, iconStyles } from "../auth-styles";
import { formatCountdown } from "../countdown-utils";

interface ResendSectionProps {
  countdown: number;
  loading: boolean;
  onResend: () => void;
}

export function ResendSection({ countdown, loading, onResend }: ResendSectionProps) {
  return (
    <>
      <div className="flex w-full items-center gap-4">
        <div className="h-px flex-1 bg-border" />
        <span className="text-muted-foreground text-xs">Didn&apos;t receive it?</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex w-full items-center justify-between">
        <p className={cn("text-muted-foreground text-sm", countdownStyles)}>
          {countdown > 0 ? (
            <span className="font-medium text-foreground tabular-nums">
              {formatCountdown(countdown)}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-foreground">
              <HugeiconsIcon icon={FlashIcon} className="size-3" />
              Ready
            </span>
          )}
        </p>

        <Button
          variant="ghost"
          size="sm"
          onClick={onResend}
          disabled={loading || countdown > 0}
          className={cn(buttonStyles, loading && "opacity-70")}
        >
          {loading ? (
            <HugeiconsIcon icon={RadialIcon} className="size-4 animate-spin" />
          ) : (
            <>
              <HugeiconsIcon
                icon={RefreshIcon}
                className={cn("size-4", iconStyles, countdown > 0 && "animate-pulse")}
              />
              <span className="ml-2">Resend Magic Link</span>
            </>
          )}
        </Button>
      </div>
    </>
  );
}
