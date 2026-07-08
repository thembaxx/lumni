"use client";

import { cn } from "@/lib/utils";

interface RecentQualityRecordsCardProps {
  records: Array<{ questionType?: string; score: number; timestamp: number }>;
}

export function RecentQualityRecordsCard({ records }: RecentQualityRecordsCardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        "rounded-card-lg",
        "border",
        "border-border/80",
        "bg-card",
        "shadow-level-2",
        "transition-colors",
      )}
    >
      <div className={cn("border-border/60", "border-b", "p-4")}>
        <h2 className={cn("font-heading", "font-medium")}>Recent Quality Records</h2>
      </div>
      {records.length === 0 ? (
        <div className={cn("p-4", "text-muted-foreground", "text-sm")}>No quality records yet.</div>
      ) : (
        <div className={cn("flex flex-col")}>
          {records.map((r, i) => (
            <div
              key={`${r.timestamp}-${i}`}
              className={cn(
                "flex items-center gap-2 border-border/40 border-b px-4 py-2 text-xs last:border-b-0",
              )}
            >
              <span className={cn("w-24 font-mono text-muted-foreground tabular-nums")}>
                {new Date(r.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn("w-20 text-muted-foreground capitalize")}>
                {r.questionType?.replace(/_/g, " ") ?? "unknown"}
              </span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  r.score >= 80
                    ? "text-success"
                    : r.score >= 50
                      ? "text-(--system-warning)"
                      : "text-destructive",
                )}
              >
                {r.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
