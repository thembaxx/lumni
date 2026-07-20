"use client";

import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import PlayIcon from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { useGamificationContext } from "@/contexts/gamification-provider";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { SpringCard } from "./parts/spring-card";

export const StreakCard = memo(function StreakCard() {
  const { gamification, currentStreak } = useGamificationContext();
  const { push } = useRouter();

  const today = new Date().toDateString();
  const practicedToday = gamification.lastPracticeDate === today;

  return (
    <SpringCard glass index={0}>
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "relative flex size-14 shrink-0 items-center justify-center rounded-2xl transition-colors",
              currentStreak > 0
                ? "bg-warning/15 text-warning ring-1 ring-warning/30"
                : "bg-muted text-muted-foreground",
            )}
          >
            <HugeiconsIcon
              icon={FireIcon}
              className={cn("size-7", currentStreak > 0 && "animate-float-bob")}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-4xl text-foreground tabular-nums tracking-tight">
                {currentStreak}
              </span>
              <span className="font-medium text-muted-foreground text-xs">
                {currentStreak === 1 ? "day" : "days"}
              </span>
            </div>
            <p className="mt-0.5 text-muted-foreground text-xs">
              {practicedToday
                ? "Studied today! Keep it going."
                : currentStreak > 0
                  ? "Study today to keep your streak alive!"
                  : "Start a streak by practicing today."}
            </p>
            {currentStreak === 0 && !practicedToday && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 h-10 gap-1.5 text-xs press-scale"
                onClick={() => push("/quiz")}
              >
                <HugeiconsIcon icon={PlayIcon} data-icon="inline-start" />
                Start practicing
              </Button>
            )}
          </div>
        </div>
      </div>
    </SpringCard>
  );
});
