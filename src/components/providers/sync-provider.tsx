"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { logError } from "@/lib/shared/logger";
import { useAuth } from "@/lib/auth/auth-context";
import { createSyncService, initSyncWriters } from "@/lib/sync";
import { getOutboxCount } from "@/lib/sync/outbox";
import type { SyncStatus, SyncService } from "@/lib/sync/types";

interface SyncContextValue {
  status: SyncStatus;
  triggerSync: () => void;
  pendingCount: number;
}

export const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.$id ?? null;
  const [status, setStatus] = useState<SyncStatus>({
    state: "idle",
    pendingWrites: 0,
    lastSyncAt: null,
    lastError: null,
  });
  const [pendingCount, setPendingCount] = useState(0);
  const serviceRef = useRef<SyncService | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || typeof window === "undefined") return;
    initializedRef.current = true;
    initSyncWriters().catch((err) => logError("SyncProvider.init", err));
  }, []);

  useEffect(() => {
    if (!userId) return;

    const service = createSyncService(() => userId);
    serviceRef.current = service;

    const unsub = service.onStatusChange(setStatus);
    service.start();

    const onOnline = () => {
      service.trigger().catch((err) => logError("SyncProvider.online", err));
    };
    window.addEventListener("online", onOnline);

    const countInterval = setInterval(async () => {
      try {
        const count = await getOutboxCount();
        setPendingCount(count);
      } catch (err) {
        logError("SyncProvider.outboxCount", err);
      }
    }, 10000);

    return () => {
      unsub();
      service.stop();
      window.removeEventListener("online", onOnline);
      clearInterval(countInterval);
    };
  }, [userId]);

  const triggerSync = useCallback(() => {
    serviceRef.current?.trigger().catch((err) => logError("SyncProvider.trigger", err));
  }, []);

  const contextValue = useMemo(
    () => ({ status, triggerSync, pendingCount }),
    [status, triggerSync, pendingCount],
  );

  return <SyncContext.Provider value={contextValue}>{children}</SyncContext.Provider>;
}

export function useSyncContext(): SyncContextValue {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useSyncContext must be used within SyncProvider");
  return ctx;
}
