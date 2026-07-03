import { Effect } from "effect";
import type { ObservabilityDataAccess } from "@/lib/db";
import type { StoredGamification } from "./types";
import { logError } from "@/lib/shared/logger";
import { enqueueOutbox } from "@/lib/sync/outbox";
import { saveWeeklySnapshot } from "@/lib/services/leaderboard-service";

export function persistEffect(
  db: ObservabilityDataAccess,
  data: StoredGamification,
): Effect.Effect<void> {
  const record = { ...data, id: 1 as const };
  return Effect.tryPromise(() => db.gamification.put(record)).pipe(
    Effect.catchAll((err) => Effect.sync(() => logError("GamificationService.persist", err))),
  );
}

export function persist(db: ObservabilityDataAccess, data: StoredGamification): void {
  const record = { ...data, id: 1 as const };
  db.gamification.put(record).catch((err) => logError("GamificationService.persist", err));
  enqueueOutbox("gamification", "1", "update", data).catch((err) =>
    logError("GamificationService.persist", err),
  );
}

export function saveSnapshot(data: StoredGamification): void {
  const label =
    typeof window !== "undefined"
      ? window.localStorage.getItem("lumni_display_name") || undefined
      : undefined;
  setTimeout(() => {
    saveWeeklySnapshot(label || "You", data.totalXp, data.currentStreak);
  }, 0);
}

export function saveSnapshotEffect(data: StoredGamification): Effect.Effect<void> {
  return Effect.sync(() => saveSnapshot(data));
}
