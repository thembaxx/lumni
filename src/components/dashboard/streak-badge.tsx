"use client";

import { useGamificationContext } from "@/contexts/gamification-provider";
import { AnimatedStreakIcon } from "./parts/animated-streak-icon";

export function StreakBadge() {
  const { gamification, currentStreak } = useGamificationContext();
  const today = new Date().toDateString();
  const practicedToday = gamification.lastPracticeDate === today;

  return (
    <div className="flex shrink-0 items-center gap-2 rounded-full bg-warning/10 px-3 py-1.5 ring-1 ring-warning/20">
      <AnimatedStreakIcon streak={currentStreak} className="        size-9! rounded-card" />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-foreground text-lg tabular-nums tracking-tight">
            {currentStreak}
          </span>
          <span className="text-muted-foreground text-xs">
            {currentStreak === 1 ? "day" : "day streak"}
          </span>
        </div>
        <span className="text-muted-foreground text-(--fs-caption-3)">
          {practicedToday
            ? "Studied today"
            : currentStreak > 0
              ? "Study today to keep it"
              : "Start practicing"}
        </span>
      </div>
    </div>
  );
}
