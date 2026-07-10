"use client";

import { useSyncContext } from "@/components/providers/sync-provider";

export function SyncStatusIndicator() {
  const { status, triggerSync, pendingCount } = useSyncContext();

  const stateLabel =
    status.state === "idle"
      ? "Synced"
      : status.state === "syncing"
        ? "Syncing\u2026"
        : status.state === "error"
          ? "Sync error"
          : "Offline";

  const stateColor =
    status.state === "idle"
      ? "bg-green-500"
      : status.state === "syncing"
        ? "bg-yellow-500"
        : status.state === "error"
          ? "bg-red-500"
          : "bg-gray-500";

  return (
    <button
      type="button"
      onClick={triggerSync}
      disabled={status.state === "syncing"}
      className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground shadow-level-1"
      aria-label={`Sync status: ${stateLabel}${pendingCount > 0 ? `, ${pendingCount} pending writes` : ""}. Click to sync now.`}
    >
      <span className={`h-2 w-2 rounded-full ${stateColor}`} aria-hidden="true" />
      <span>{stateLabel}</span>
      {pendingCount > 0 && (
        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
          {pendingCount}
        </span>
      )}
      {status.lastSyncAt && (
        <span className="text-muted-foreground">
          {new Date(status.lastSyncAt).toLocaleTimeString()}
        </span>
      )}
    </button>
  );
}
