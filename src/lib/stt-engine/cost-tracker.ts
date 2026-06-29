import type { STTUsageEntry, STTUsageReport } from "./types";

export async function trackSTTUsage(provider: string, durationSeconds: number): Promise<void> {
  if (typeof window === "undefined") return;

  const { offlineDB } = await import("@/lib/db/schema");
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const minutes = durationSeconds / 60;

  const costPerMinute: Record<string, number> = {
    deepgram: 0.0043,
    "browser-native": 0,
    "whisper-wasm": 0,
  };

  const cost = minutes * (costPerMinute[provider] ?? 0);

  await offlineDB.table<STTUsageEntry>("sttUsage").add({
    date,
    provider,
    minutes,
    cost,
  });
}

export async function getSTTUsageReport(): Promise<STTUsageReport> {
  if (typeof window === "undefined") {
    return { totalMinutes: 0, totalCost: 0, byProvider: [], byDate: [] };
  }

  const { offlineDB } = await import("@/lib/db/schema");
  const all = await offlineDB.table<STTUsageEntry>("sttUsage").toArray();

  const byProviderMap = new Map<string, { minutes: number; cost: number }>();
  const byDateMap = new Map<string, { minutes: number; cost: number }>();

  for (const entry of all) {
    const p = byProviderMap.get(entry.provider) ?? { minutes: 0, cost: 0 };
    p.minutes += entry.minutes;
    p.cost += entry.cost;
    byProviderMap.set(entry.provider, p);

    const d = byDateMap.get(entry.date) ?? { minutes: 0, cost: 0 };
    d.minutes += entry.minutes;
    d.cost += entry.cost;
    byDateMap.set(entry.date, d);
  }

  const byProvider = Array.from(byProviderMap.entries()).map(([provider, data]) => ({
    provider,
    ...data,
  }));
  const byDate = Array.from(byDateMap.entries()).map(([date, data]) => ({ date, ...data }));

  const totalMinutes = all.reduce((s, e) => s + e.minutes, 0);
  const totalCost = all.reduce((s, e) => s + e.cost, 0);

  return { totalMinutes, totalCost, byProvider, byDate };
}
