import type { DataAccess, DataAccessTable } from "@/lib/db/data-access";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { logError } from "@/lib/shared/logger";
import {
  getOutboxCount,
  getPendingOutboxEntries,
  incrementRetry,
  removeOutboxEntries,
} from "./outbox";
import { SYNCABLE_TABLES } from "./sync-writer";
import type { SyncResult, SyncService, SyncStatus } from "./types";

export class SyncServiceClass implements SyncService {
  private state: SyncStatus["state"] = "idle";
  private lastSyncAt: number | null = null;
  private lastError: string | null = null;
  private pendingWritesCount = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private cleanupOnline: (() => void) | null = null;
  private readonly listeners = new Set<(status: SyncStatus) => void>();
  private readonly db: DataAccess;
  private readonly getUserId: () => string | null;

  constructor(opts: { db: DataAccess; userId: () => string | null }) {
    this.db = opts.db;
    this.getUserId = opts.userId;
  }

  private notify(): void {
    const status = this.status();
    for (const cb of this.listeners) {
      try {
        cb(status);
      } catch {
        // ignore listener errors
      }
    }
  }

  status(): SyncStatus {
    return {
      state: this.state,
      pendingWrites: this.pendingWritesCount,
      lastSyncAt: this.lastSyncAt,
      lastError: this.lastError,
    };
  }

  private async pushOutbox(): Promise<{ pushed: number; errors: string[] }> {
    const uid = this.getUserId();
    if (!uid) return { pushed: 0, errors: [] };

    const entries = await getPendingOutboxEntries(this.db, 50);
    this.pendingWritesCount = entries.length;
    this.notify();
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
          if (entry.id == null) {
            logError("SyncService.pushOutbox", new Error("Outbox entry missing id"), {
              entry: entry.table,
            });
            continue;
          }
          pushed.push(entry.id);
        } else {
          errors.push(`Push ${entry.table}/${entry.recordId}: ${response.status}`);
          if (entry.id == null) {
            logError("SyncService.pushOutbox", new Error("Outbox entry missing id on retry"), {
              entry: entry.table,
            });
            continue;
          }
          await incrementRetry(this.db, entry.id);
        }
      } catch (err) {
        errors.push(`Push ${entry.table}/${entry.recordId}: network error`);
        logError("Sync.push", err);
      }
    }

    if (pushed.length > 0) {
      await removeOutboxEntries(this.db, pushed);
    }

    this.pendingWritesCount = await getOutboxCount(this.db);
    this.notify();

    return { pushed: pushed.length, errors };
  }

  private async pullRemote(): Promise<{
    pulled: number;
    conflicts: number;
    errors: string[];
  }> {
    const uid = this.getUserId();
    if (!uid) return { pulled: 0, conflicts: 0, errors: [] };

    const errors: string[] = [];
    let pulled = 0;
    const conflicts = 0;

    try {
      const checkpoints = await this.db.syncCheckpoints.toArray();
      const checkpointMap = new Map(checkpoints.map((c) => [c.table, c]));

      const tableAccessors: Record<string, DataAccessTable<unknown, string | number>> = {
        flashcards: this.db.flashcards,
        notes: this.db.notes,
        competencies: this.db.competencies,
        gamification: this.db.gamification,
        retentionRecurrence: this.db.retentionRecurrence,
        wrongAnswers: this.db.wrongAnswers,
        chatMessages: this.db.chatMessages,
        questionRatings: this.db.questionRatings,
        bookmarks: this.db.bookmarks,
        examSessions: this.db.examSessions,
        quizAttempts: this.db.quizAttempts,
        studyPlans: this.db.studyPlans,
        studyGuides: this.db.studyGuides,
        vocabularyList: this.db.vocabularyList,
        pronunciationHistory: this.db.pronunciationHistory,
        storyCache: this.db.storyCache,
        storyQuestions: this.db.storyQuestions,
      };

      for (const table of SYNCABLE_TABLES) {
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

          for (const record of data.records as Array<{
            id: string | number;
            updatedAt?: string;
          }>) {
            const id =
              typeof record.id === "number" || typeof record.id === "string"
                ? record.id
                : String(record.id);
            const local = await accessor.get(id);
            if (
              local &&
              typeof local === "object" &&
              "updatedAt" in (local as Record<string, unknown>)
            ) {
              const localTime = new Date(
                (local as Record<string, unknown>).updatedAt as string,
              ).getTime();
              const remoteTime = record.updatedAt ? new Date(record.updatedAt).getTime() : 0;
              if (!isNaN(localTime) && !isNaN(remoteTime) && localTime >= remoteTime) {
                continue;
              }
            }
            await accessor.put(record);
          }

          await this.db.syncCheckpoints.put({
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

  async trigger(): Promise<SyncResult> {
    if (this.state === "syncing") return { pushed: 0, pulled: 0, conflicts: 0, errors: [] };

    this.state = "syncing";
    this.notify();

    const pushResult = await this.pushOutbox();
    const pullResult = await this.pullRemote();

    if (pushResult.errors.length === 0 && pullResult.errors.length === 0) {
      this.state = "idle";
      this.lastSyncAt = Date.now();
      this.lastError = null;
    } else {
      this.state = "error";
      this.lastError = [...pushResult.errors, ...pullResult.errors].join("; ");
    }
    this.notify();

    return {
      pushed: pushResult.pushed,
      pulled: pullResult.pulled,
      conflicts: pullResult.conflicts,
      errors: [...pushResult.errors, ...pullResult.errors],
    };
  }

  start(): void {
    if (this.intervalId) return;
    this.state = "idle";
    this.notify();

    this.cleanupOnline = () => {
      this.trigger().catch((err) => logError("Sync.online", err));
    };
    window.addEventListener("online", this.cleanupOnline);

    this.trigger().catch((err) => logError("Sync.start", err));

    this.intervalId = setInterval(
      () => {
        this.trigger().catch((err) => logError("Sync.interval", err));
      },
      5 * 60 * 1000,
    );
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.cleanupOnline) {
      window.removeEventListener("online", this.cleanupOnline);
      this.cleanupOnline = null;
    }
    this.state = "idle";
    this.notify();
  }

  onStatusChange(cb: (status: SyncStatus) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export function createSyncService(userId: () => string | null): SyncService {
  return new SyncServiceClass({ db: dexieDataAccess, userId });
}
