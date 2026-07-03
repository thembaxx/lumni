import type { DataAccessTable } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import { getPendingOutboxEntries, incrementRetry, removeOutboxEntries } from "./outbox";
import type { SyncResult, SyncService, SyncStatus } from "./types";

export function createSyncService(userId: () => string | null): SyncService {
  let state: SyncStatus["state"] = "idle";
  let lastSyncAt: number | null = null;
  let lastError: string | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<(status: SyncStatus) => void>();

  function notify() {
    const status = getStatus();
    for (const cb of listeners) {
      try {
        cb(status);
      } catch {
        // ignore listener errors
      }
    }
  }

  function getStatus(): SyncStatus {
    return {
      state,
      pendingWrites: 0,
      lastSyncAt,
      lastError,
    };
  }

  async function pushOutbox(): Promise<{ pushed: number; errors: string[] }> {
    const uid = userId();
    if (!uid) return { pushed: 0, errors: [] };

    const entries = await getPendingOutboxEntries(50);
    if (entries.length === 0) return { pushed: 0, errors: [] };

    const pushed: number[] = [];
    const errors: string[] = [];

    for (const entry of entries) {
      try {
        const response = await fetch("/api/sync/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            table: entry.table,
            recordId: entry.recordId,
            operation: entry.operation,
            data: entry.data,
            createdAt: entry.createdAt,
          }),
        });

        if (response.ok) {
          pushed.push(entry.id!);
        } else {
          errors.push(`Push ${entry.table}/${entry.recordId}: ${response.status}`);
          await incrementRetry(entry.id!);
        }
      } catch (err) {
        errors.push(`Push ${entry.table}/${entry.recordId}: network error`);
        logError("Sync.push", err);
      }
    }

    if (pushed.length > 0) {
      await removeOutboxEntries(pushed);
    }

    return { pushed: pushed.length, errors };
  }

  async function pullRemote(): Promise<{ pulled: number; conflicts: number; errors: string[] }> {
    const uid = userId();
    if (!uid) return { pulled: 0, conflicts: 0, errors: [] };

    const errors: string[] = [];
    let pulled = 0;
    let conflicts = 0;

    try {
      const { dexieDataAccess } = await import("@/lib/db/dexie-data-access");
      const checkpoints = await dexieDataAccess.syncCheckpoints.toArray();
      const checkpointMap = new Map(checkpoints.map((c) => [c.table, c]));

      const tables = [
        "flashcards",
        "notes",
        "competencies",
        "gamification",
        "retentionRecurrence",
        "wrongAnswers",
        "chatMessages",
        "questionRatings",
        "bookmarks",
        "examSessions",
        "quizAttempts",
        "studyPlans",
      ];

      const tableAccessors: Record<string, DataAccessTable<unknown, string | number>> = {
        flashcards: dexieDataAccess.flashcards,
        notes: dexieDataAccess.notes,
        competencies: dexieDataAccess.competencies,
        gamification: dexieDataAccess.gamification,
        retentionRecurrence: dexieDataAccess.retentionRecurrence,
        wrongAnswers: dexieDataAccess.wrongAnswers,
        chatMessages: dexieDataAccess.chatMessages,
        questionRatings: dexieDataAccess.questionRatings,
        bookmarks: dexieDataAccess.bookmarks,
        examSessions: dexieDataAccess.examSessions,
        quizAttempts: dexieDataAccess.quizAttempts,
        studyPlans: dexieDataAccess.studyPlans,
      };

      for (const table of tables) {
        try {
          const checkpoint = checkpointMap.get(table);
          const since = checkpoint?.lastPulledAt ?? 0;

          const response = await fetch(`/api/sync/pull?table=${table}&since=${since}`);

          if (!response.ok) {
            errors.push(`Pull ${table}: ${response.status}`);
            continue;
          }

          const data: { records: unknown[]; version: string } = await response.json();
          if (data.records.length === 0) continue;

          pulled += data.records.length;
          const accessor = tableAccessors[table];
          if (!accessor) continue;
          for (const record of data.records as Array<{ id: string }>) {
            await accessor.put(record);
          }

          await dexieDataAccess.syncCheckpoints.put({
            table,
            lastPulledAt: Date.now(),
            lastPulledVersion: data.version,
          });
        } catch (err) {
          errors.push(`Pull ${table}: error`);
          logError("Sync.pull", err);
        }
      }
    } catch (err) {
      logError("Sync.pull", err);
    }

    return { pulled, conflicts, errors };
  }

  async function trigger(): Promise<SyncResult> {
    if (state === "syncing") return { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

    state = "syncing";
    notify();

    const pushResult = await pushOutbox();
    const pullResult = await pullRemote();

    if (pushResult.errors.length === 0 && pullResult.errors.length === 0) {
      state = "idle";
      lastSyncAt = Date.now();
      lastError = null;
    } else {
      state = "error";
      lastError = [...pushResult.errors, ...pullResult.errors].join("; ");
    }
    notify();

    return {
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
      conflicts: pullResult.conflicts,
      errors: [...pushResult.errors, ...pullResult.errors],
    };
  }

  function start() {
    if (intervalId) return;
    state = "idle";
    notify();

    trigger().catch((err) => logError("Sync.start", err));

    intervalId = setInterval(
      () => {
        trigger().catch((err) => logError("Sync.interval", err));
      },
      5 * 60 * 1000,
    );
  }

  function stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    state = "idle";
    notify();
  }

  return {
    start,
    stop,
    status: getStatus,
    trigger,
    onStatusChange: (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };
}
