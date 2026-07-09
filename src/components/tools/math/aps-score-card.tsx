"use client";

import CalculatorIcon from "@hugeicons/core-free-icons/CalculatorIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";

interface ApsScoreCardProps {
  totalAPS: number;
}

export function ApsScoreCard({ totalAPS }: ApsScoreCardProps) {
  const scoreLevel = totalAPS >= 32 ? "high" : totalAPS >= 24 ? "medium" : "low";
  return (
    <div className="px-5 pb-5">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-level-2">
        <div className="mb-3 flex items-center justify-between">
          <span className="ios-subhead text-(--system-text-secondary)">Your APS Score</span>
          <HugeiconsIcon icon={CalculatorIcon} className="size-5 text-(--system-accent)" />
        </div>
        <div
          className={cn(
            "text-center font-bold text-5xl tabular-nums",
            scoreLevel === "high" && "text-success",
            scoreLevel === "medium" && "text-warning",
            scoreLevel === "low" && "text-destructive",
          )}
        >
          {totalAPS}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-system-background-tertiary">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              scoreLevel === "high" && "bg-success",
              scoreLevel === "medium" && "bg-warning",
              scoreLevel === "low" && "bg-destructive",
            )}
            style={{ width: `${(totalAPS / 42) * 100}%` }}
          />
        </div>
        <p className="ios-caption-1 mt-3 text-center text-muted-foreground text-sm">
          Max possible: 42 points (6 subjects × 7)
        </p>
      </div>
    </div>
  );
}
