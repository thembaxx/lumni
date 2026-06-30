"use client";

import { cn } from "@/lib/utils";

interface QualityByTypeCardProps {
  byType: Record<string, { count: number; avgScore: number }>;
}

export function QualityByTypeCard({ byType }: QualityByTypeCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        "rounded-card-lg",
        "border",
        "border-border/80",
        "bg-card",
        "p-6",
        "shadow-level-2",
        "transition-colors",
      )}
    >
      <h2 className={cn("font-heading", "font-medium", "text-lg", "mb-4")}>Quality by Type</h2>
      {Object.keys(byType).length === 0 ? (
        <p className={cn("text-muted-foreground", "text-sm")}>No data yet.</p>
      ) : (
        <div className={cn("flex flex-col gap-2")}>
          {Object.entries(byType).map(([type, stats]) => (
            <div key={type} className={cn("flex items-center justify-between")}>
              <span className={cn("text-sm capitalize")}>{type.replace(/_/g, " ")}</span>
              <span className={cn("font-mono text-sm tabular-nums")}>
                {stats.count} ({stats.avgScore.toFixed(0)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
