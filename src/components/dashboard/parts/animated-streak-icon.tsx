"use client";

import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useRef, useState } from "react";
import { useEasterEgg } from "@/lib/shared/easter-egg-context";
import { cn } from "@/lib/utils";

interface AnimatedStreakIconProps {
  streak: number;
  className?: string;
}

export function AnimatedStreakIcon({ streak, className }: AnimatedStreakIconProps) {
  const [burst, setBurst] = useState(false);
  const clickCount = useRef(0);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { trigger } = useEasterEgg();

  const handleClick = useCallback(() => {
    clickCount.current++;
    if (clickCount.current >= 5) {
      clickCount.current = 0;
      setBurst(true);
      trigger("matrix");
      burstTimer.current = setTimeout(() => setBurst(false), 1200);
    } else {
      clearTimeout(burstTimer.current);
      burstTimer.current = setTimeout(() => {
        clickCount.current = 0;
      }, 2000);
    }
  }, [trigger]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "relative flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors",
        streak > 0
          ? "bg-warning/15 text-warning ring-1 ring-warning/30"
          : "bg-muted text-muted-foreground",
        className,
      )}
      aria-label={
        streak > 0 ? `${streak} day streak. Click 5 times for a secret.` : "No streak yet"
      }
    >
      <HugeiconsIcon
        icon={FireIcon}
        className={cn(
          "relative z-elevated size-7",
          streak > 0 && !burst && "animate-float-bob",
          burst && "animate-fire-burst",
        )}
      />
      {burst && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="size-14 animate-fire-burst rounded-full bg-warning/30 blur-xl" />
        </div>
      )}
    </button>
  );
}
