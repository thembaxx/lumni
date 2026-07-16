"use client";

import { useContext } from "react";
import { SyncContext } from "@/components/providers/sync-provider";
import { cn } from "@/lib/utils";

export function SyncStatusPill({ className }: { className?: string }) {
  const ctx = useContext(SyncContext);
  if (!ctx) return null;

  const { state, pendingWrites, lastError } = ctx.status;

  const dotColor =
    state === "offline"
      ? "bg-warning"
      : state === "syncing"
        ? "bg-info"
        : state === "error"
          ? "bg-destructive"
          : pendingWrites > 0
            ? "bg-warning"
            : "bg-success";

  const label =
    state === "offline"
      ? "Offline"
      : state === "syncing"
        ? "Syncing\u2026"
        : state === "error"
          ? "Error"
          : pendingWrites > 0
            ? `${pendingWrites} pending`
            : "Synced";

  return (
    <div
      className={cn("flex items-center gap-1.5 rounded-full bg-muted/60 px-2 py-1", className)}
      role="status"
      aria-live="polite"
      aria-label={`Sync status: ${label}`}
      title={lastError ?? label}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", dotColor)} />
      <span className="text-(--fs-caption-3) font-medium text-muted-foreground tabular-nums leading-none">
        {label}
      </span>
    </div>
  );
}
