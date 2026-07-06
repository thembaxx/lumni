"use client";

import { cn } from "@/lib/utils";

interface StatsCardsGridProps {
  totalRequests: number;
  successRate: number;
  avgScore: number;
  passRate: number;
}

export function StatsCardsGrid({
  totalRequests,
  successRate,
  avgScore,
  passRate,
}: StatsCardsGridProps) {
  return (
    <div className={cn("grid", "grid-cols-2", "sm:grid-cols-4", "gap-4")}>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Total Requests</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{totalRequests}</p>
      </div>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Success Rate</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{successRate}%</p>
      </div>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Avg Quality</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{avgScore}/100</p>
      </div>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Pass Rate</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{passRate}%</p>
      </div>
    </div>
  );
}
