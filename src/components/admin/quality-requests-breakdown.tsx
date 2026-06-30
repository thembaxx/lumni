"use client";

import { cn } from "@/lib/utils";

interface RequestsBreakdownCardProps {
  generateCount: number;
  gradeCount: number;
  hintCount: number;
}

export function RequestsBreakdownCard({
  generateCount,
  gradeCount,
  hintCount,
}: RequestsBreakdownCardProps) {
  const total = generateCount + gradeCount + hintCount;
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
      <h2 className={cn("font-heading", "font-medium", "text-lg", "mb-4")}>Requests Breakdown</h2>
      <div className={cn("flex flex-col gap-3")}>
        {[
          { label: "Generate", count: generateCount, color: "bg-blue-500" },
          { label: "Grade", count: gradeCount, color: "bg-green-500" },
          { label: "Hint", count: hintCount, color: "bg-amber-500" },
        ].map(({ label, count, color }) => (
          <div key={label} className={cn("flex items-center gap-3")}>
            <div className={cn("h-2 w-24 rounded-full bg-muted")}>
              <div
                className={cn("h-full rounded-full", color)}
                style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
              />
            </div>
            <span className={cn("w-16 font-medium text-sm")}>{label}</span>
            <span className={cn("font-mono text-muted-foreground text-sm tabular-nums")}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
