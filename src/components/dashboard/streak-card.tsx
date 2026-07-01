"use client";

import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export const StreakCard = memo(function StreakCard() {
  const { gamification, currentStreak } = useGamification();
  const { push } = useRouter();

  const today = new Date().toDateString();
  const practicedToday = gamification.lastPracticeDate === today;

  return (
    <div className="card-entrance">
      <Card
        className={cn(
          "overflow-hidden rounded-card shadow-level-1 transition-colors",
          currentStreak > 0 ? "border border-warning/20 bg-warning/5" : "border border-border/80",
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "flex size-14 items-center justify-center rounded-2xl transition-colors",
                currentStreak > 0 ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground",
              )}
            >
              <HugeiconsIcon icon={FireIcon} className="size-7" />
            </div>
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="font-extrabold text-3xl text-foreground tabular-nums tracking-tight">
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
                  <HugeiconsIcon icon={PlayFreeIcons} className="size-3.5" />
                  Start practicing
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
