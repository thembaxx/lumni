"use client";

import CloudSyncIcon from "@hugeicons/core-free-icons/CloudSyncIcon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon";
import Tick01Icon from "@hugeicons/core-free-icons/Tick01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { useSync } from "@/hooks/use-sync";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { useAuth } from "@/lib/auth/auth-context";

export function SyncTab() {
  const { user } = useAuth();
  const userId = user?.$id;
  const { triggerSync, isSyncing, status: syncStatus } = useSync(userId);
  const { isOnline, pendingCount } = useSyncStatus();
  const [synced, setSynced] = useState(false);

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;
    await triggerSync();
    setSynced(true);
    setTimeout(() => setSynced(false), 2500);
  };

  const lastSyncLabel = syncStatus.lastSyncAt
    ? new Date(syncStatus.lastSyncAt).toLocaleString()
    : "Never";

  return (
    <div className="flex flex-col gap-6">
      <ListSection
        header="Data Sync"
        footer="Your local data syncs automatically. You can also trigger a manual sync."
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex size-9 items-center justify-center rounded-xl ${
                isOnline ? "bg-system-accent/10" : "bg-warning/10"
              }`}
            >
              <HugeiconsIcon
                icon={CloudSyncIcon}
                className={`size-5 ${isOnline ? "text-system-accent" : "text-warning"}`}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground text-sm">
                {isOnline ? "Online" : "Offline"}
              </span>
              <span className="text-muted-foreground text-xs">
                {pendingCount > 0 ? `${pendingCount} pending changes` : "All synced"}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={!isOnline || isSyncing}
            onClick={handleSync}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-[background-color,transform] active:scale-[0.96] ${
              synced
                ? "bg-system-accent/10 text-system-accent"
                : "bg-secondary text-foreground hover:bg-secondary/70"
            }`}
          >
            <HugeiconsIcon
              icon={synced ? Tick01Icon : Refresh01Icon}
              className={`size-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {synced ? "Synced" : isSyncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>

        <ListCell
          title="Last synced"
          subtitle={lastSyncLabel}
          leading={<HugeiconsIcon icon={DatabaseIcon} className="size-4" />}
        />
      </ListSection>

      <ListSection header="What Gets Synced" footer="Data is encrypted in transit and at rest.">
        <ListCell title="Quiz attempts & results" subtitle="Synced when online" showSeparator />
        <ListCell title="Flashcard progress" subtitle="SM-2 ratings & due dates" showSeparator />
        <ListCell
          title="Study plan & sessions"
          subtitle="Schedule and completion data"
          showSeparator
        />
        <ListCell
          title="Pronunciation history"
          subtitle="Voice recording attempts"
          showSeparator={false}
        />
      </ListSection>
    </div>
  );
}
