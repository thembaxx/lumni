"use client";

import { logError } from "@/lib/shared/logger";
import type { SyncStatus } from "@/lib/sync";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseSyncReturn {
  status: SyncStatus;
  triggerSync: () => Promise<void>;
  isSyncing: boolean;
}

export function useSync(userId?: string | null): UseSyncReturn {
  const [status, setStatus] = useState<SyncStatus>({
    state: "idle",
    pendingWrites: 0,
    lastSyncAt: null,
    lastError: null,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const serviceRef = useRef<ReturnType<typeof import("@/lib/sync").createSyncService> | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    import("@/lib/sync")
      .then(({ createSyncService }) => {
        if (cancelled) return;
        const service = createSyncService(() => userId);
        service.onStatusChange(setStatus);
        service.start();
        serviceRef.current = service;
      })
      .catch((err) => logError("UseSync.init", err));

    return () => {
      cancelled = true;
      serviceRef.current?.stop();
      serviceRef.current = null;
    };
  }, [userId]);

  const triggerSync = useCallback(async () => {
    if (!serviceRef.current || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await serviceRef.current.trigger();
      if (result.errors.length > 0) {
        logError("UseSync.trigger", new Error(result.errors.join("; ")));
      }
    } catch (err) {
      logError("UseSync.trigger", err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing]);

  return { status, triggerSync, isSyncing };
}
