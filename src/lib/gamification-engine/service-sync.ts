import type { StoredGamification } from "./types";
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import { apiFetch } from "@/lib/shared/api-fetch";
import { logError } from "@/lib/shared/logger";

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
    const label =
      (typeof window !== "undefined" ? window.localStorage.getItem("lumni_display_name") : null) ||
      undefined;
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
    const label =
      (typeof window !== "undefined" ? window.localStorage.getItem("lumni_display_name") : null) ||
      undefined;
    await apiFetch("/api/gamification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, userId, label }),
    });
  } catch (err) {
    logError("GamificationService.syncToLeaderboard", err);
  }
}
