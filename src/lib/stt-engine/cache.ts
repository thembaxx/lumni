import type { STTCacheEntry, STTResult } from "./types";

export async function getCachedSTTResult(key: string): Promise<STTResult | undefined> {
  if (typeof window === "undefined") return undefined;

  const { offlineDB } = await import("@/lib/db/schema");
  const entry = await offlineDB.table<STTCacheEntry>("sttCache").get(key);
  if (!entry) return undefined;
  if (entry.expiresAt < Date.now()) {
    await offlineDB.table("sttCache").delete(key);
    return undefined;
  }
  return JSON.parse(entry.result) as STTResult;
}

export async function cacheSTTResult(
  key: string,
  result: STTResult,
  ttlMs: number = 7 * 24 * 60 * 60 * 1000,
): Promise<void> {
  if (typeof window === "undefined") return;

  const { offlineDB } = await import("@/lib/db/schema");
  await offlineDB.table<STTCacheEntry>("sttCache").put({
    key,
    result: JSON.stringify(result),
    expiresAt: Date.now() + ttlMs,
  });
}

export function buildCacheKey(audio: { blob: Blob | Float32Array }, language?: string): string {
  let size: number;
  if (audio.blob instanceof Blob) {
    size = audio.blob.size;
  } else {
    size = audio.blob.length;
  }
  return `stt:${language ?? "en"}:${size}`;
}
