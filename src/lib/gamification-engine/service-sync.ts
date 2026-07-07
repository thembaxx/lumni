import type { StoredGamification } from "./types";
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";
import { ls, StorageKeys } from "@/lib/shared/storage";

export function scheduleSync(
  data: StoredGamification,
  syncTimer: ReturnType<typeof setTimeout> | null,
  setTimer: (t: ReturnType<typeof setTimeout> | null) => void,
): void {
  if (syncTimer) clearTimeout(syncTimer);
  setTimer(
    setTimeout(() => {
      syncToServer(data);
    }, 2000),
  );
}

export async function syncToServer(data: StoredGamification): Promise<void> {
  if (!getDataSharingConsent()) return;
  try {
    const label = ls.getString(StorageKeys.DisplayName) || undefined;
    await apiFetch("/api/gamification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, label }),
    });
  } catch (err) {
    logError("GamificationService.syncToServer", err);
  }
}

export async function syncToLeaderboard(data: StoredGamification, userId: string): Promise<void> {
  if (!getDataSharingConsent()) return;
  try {
    const label = ls.getString(StorageKeys.DisplayName) || undefined;
    await apiFetch("/api/gamification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId, label }),
    });
  } catch (err) {
    logError("GamificationService.syncToLeaderboard", err);
  }
}
