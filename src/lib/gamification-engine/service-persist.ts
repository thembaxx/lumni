import { dexieDataAccess } from "@/lib/db";
import type { ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "./types";
import { logError } from "@/lib/shared/logger";
import { ls, StorageKeys } from "@/lib/shared/storage";
import { enqueueOutbox } from "@/lib/sync/outbox";
import { saveWeeklySnapshot } from "@/lib/services";

export function persist(db: ObservabilityDataAccess, data: StoredGamification): void {
  const record = { ...data, id: 1 as const };
  db.gamification.put(record).catch((err) => logError("GamificationService.persist", err));
  enqueueOutbox(dexieDataAccess, "gamification", "1", "update", data).catch((err) =>
    logError("GamificationService.persist", err),
  );
}

export function saveSnapshot(data: StoredGamification): void {
  const label = ls.getString(StorageKeys.DisplayName) || undefined;
  setTimeout(() => {
    saveWeeklySnapshot(label || "You", data.totalXp, data.currentStreak);
  }, 0);
}
