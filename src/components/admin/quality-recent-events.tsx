"use client";

import { cn } from "@/lib/utils";

interface RecentEventsCardProps {
  events: Array<{ type: string; timestamp: number; subject?: string }>;
}

export function RecentEventsCard({ events }: RecentEventsCardProps) {
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
        <h2 className={cn("font-heading", "font-medium")}>Recent Events</h2>
      </div>
      {events.length === 0 ? (
        <div className={cn("p-4", "text-muted-foreground", "text-sm")}>No events recorded yet.</div>
      ) : (
        <div className={cn("flex flex-col")}>
          {events.map((ev, i) => (
            <div
              key={`${ev.timestamp}-${i}`}
              className={cn(
                "flex items-center gap-2 border-border/40 border-b px-4 py-2 text-xs last:border-b-0",
              )}
            >
              <span className={cn("w-24 font-mono text-muted-foreground tabular-nums")}>
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn("w-20 text-muted-foreground capitalize")}>
                {ev.type.replace(/_/g, " ")}
              </span>
              {ev.subject && <span className={cn("text-muted-foreground")}>{ev.subject}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
