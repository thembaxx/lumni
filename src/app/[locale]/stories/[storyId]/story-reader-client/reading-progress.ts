import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import { logError } from "@/lib/shared/logger";

export const COMPLETION_THRESHOLD = 90;
export const SAVE_DEBOUNCE_MS = 2000;
export const TIME_TRACK_INTERVAL_MS = 30000;

export async function loadStoryProgress(
  userId: string,
  storyId: string,
  progressIdRef: { current: number | undefined },
  progressLoadedRef: { current: boolean },
): Promise<{ scrollPercent: number; completed: boolean; timeSpentSeconds: number }> {
  progressLoadedRef.current = true;
  try {
    const record = await dexieDataAccess.storyProgress
      .where("[userId+storyId]")
      .equals([userId, storyId])
      .first();
    if (record) {
      progressIdRef.current = record.id as number;
      return {
        scrollPercent: record.scrollPercent,
        completed: record.completed,
        timeSpentSeconds: record.timeSpentSeconds,
      };
    }
  } catch (err: unknown) {
    logError("story-reader.loadProgress", err);
  }
  return { scrollPercent: 0, completed: false, timeSpentSeconds: 0 };
}

export async function saveStoryProgress(
  userId: string,
  storyId: string,
  progressIdRef: { current: number | undefined },
  pct: number,
  done: boolean,
  seconds: number,
): Promise<void> {
  if (!userId || !storyId) return;
  const id = progressIdRef.current;
  if (id !== undefined) {
    await dexieDataAccess.storyProgress
      .update(id, {
        scrollPercent: pct,
        completed: done,
        lastReadAt: Date.now(),
        timeSpentSeconds: seconds,
      })
      .catch((err: unknown) => logError("story-reader.saveProgress", err));
  } else {
    await dexieDataAccess.storyProgress
      .add({
        userId,
        storyId,
        scrollPercent: pct,
        completed: done,
        lastReadAt: Date.now(),
        timeSpentSeconds: seconds,
      })
      .then((newId: number) => {
        progressIdRef.current = newId;
      })
      .catch((err: unknown) => logError("story-reader.saveProgress", err));
  }
}
