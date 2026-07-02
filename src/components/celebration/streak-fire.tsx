"use client";

import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { getStreakMessage } from "@/lib/utils/gamification";

interface StreakFireProps {
  streak: number;
  showMilestone?: boolean;
  milestone?: number;
}

export function StreakFire({ streak, showMilestone, milestone }: StreakFireProps) {
  const isMilestone = showMilestone && milestone && streak >= milestone;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div>
          <HugeiconsIcon
            icon={FireIcon}
            className={`size-6 ${streak >= 7 ? "fill-warning" : "fill-warning/80"}`}
            fill={streak >= 7 ? "currentColor" : "none"}
          />
        </div>

        {streak >= 3 && (
          <m.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", bounce: 0 }}
          >
            <HugeiconsIcon
              icon={streak >= 30 ? FireIcon : streak >= 7 ? StarIcon : SparklesIcon}
              className={`size-4 ${streak >= 30 ? "text-warning" : streak >= 7 ? "text-warning/80" : "text-warning/60"}`}
            />
          </m.div>
        )}

        {isMilestone && (
          <m.div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="whitespace-nowrap rounded-full bg-warning px-2 py-0.5 font-extrabold text-primary-foreground text-xs">
              {getStreakMessage(milestone)}
            </div>
          </m.div>
        )}
      </div>

      <m.span
        className={`font-extrabold tabular-nums ${streak >= 7 ? "text-warning" : "text-warning/80"}`}
        key={streak}
        initial={{ scale: 1.5 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, bounce: 0 }}
      >
        {streak}
      </m.span>
    </div>
  );
}
