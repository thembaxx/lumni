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
import { useAuth } from "@/lib/auth/auth-context";
import { createSyncService } from "@/lib/sync";
import { wrapTableForSync } from "@/lib/sync/sync-writer";
import type { SyncStatus, SyncService } from "@/lib/sync/types";

interface SyncContextValue {
  status: SyncStatus;
  triggerSync: () => void;
  pendingCount: number;
}

const SyncContext = createContext<SyncContextValue | null>(null);

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
  const wrappedRef = useRef(false);

  useEffect(() => {
    if (wrappedRef.current || typeof window === "undefined") return;
    wrappedRef.current = true;

    import("@/lib/db/dexie-data-access")
      .then(({ dexieDataAccess }) => {
        // oxlint-disable-next-line typescript/no-explicit-any
        const tables: any = [
          { name: "flashcards", table: dexieDataAccess.flashcards },
          { name: "notes", table: dexieDataAccess.notes },
          { name: "competencies", table: dexieDataAccess.competencies },
          { name: "gamification", table: dexieDataAccess.gamification },
          { name: "retentionRecurrence", table: dexieDataAccess.retentionRecurrence },
          { name: "wrongAnswers", table: dexieDataAccess.wrongAnswers },
          { name: "chatMessages", table: dexieDataAccess.chatMessages },
          { name: "questionRatings", table: dexieDataAccess.questionRatings },
          { name: "bookmarks", table: dexieDataAccess.bookmarks },
          { name: "examSessions", table: dexieDataAccess.examSessions },
          { name: "quizAttempts", table: dexieDataAccess.quizAttempts },
          { name: "studyPlans", table: dexieDataAccess.studyPlans },
        ];
        for (const { name, table } of tables) {
          wrapTableForSync(name, table);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;

    const service = createSyncService(() => userId);
    serviceRef.current = service;

    const unsub = service.onStatusChange(setStatus);
    service.start();

    const onOnline = () => {
      service.trigger().catch(() => {});
    };
    window.addEventListener("online", onOnline);

    const countInterval = setInterval(async () => {
      try {
        const { getOutboxCount } = await import("@/lib/sync/outbox");
        const count = await getOutboxCount();
        setPendingCount(count);
      } catch {
        /* ignore */
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
    serviceRef.current?.trigger().catch(() => {});
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
