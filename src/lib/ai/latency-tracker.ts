import { logError } from "@/lib/shared/logger";

export interface AILatencyRecord {
  provider: string;
  durationMs: number;
  success: boolean;
  callType: "generate" | "grade" | "hint" | "visual" | "embed";
  subject?: string;
  estimatedCost?: number; // USD cents, approximate
  timestamp: string;
}

/** Per-call cost in USD cents by provider + callType */
const AI_COST_PER_CALL: Record<string, Record<string, number>> = {
  gemini: {
    generate: 0.008,
    grade: 0.003,
    hint: 0.005,
    visual: 0.003,
    embed: 0.001,
  },
  nvidia: {
    generate: 0.015,
    grade: 0.006,
    hint: 0.008,
    visual: 0.005,
    embed: 0.002,
  },
  groq: {
    generate: 0.012,
    grade: 0.005,
    hint: 0.007,
    visual: 0.004,
    embed: 0.002,
  },
};

const DEFAULT_COST = 0.01;

function estimateCallCost(provider: string, callType: AILatencyRecord["callType"]): number {
  return AI_COST_PER_CALL[provider]?.[callType] ?? DEFAULT_COST;
}

const MAX_RECORDS = 1000;
const STORAGE_KEY = "lumni_ai_latency";

function isLocalStorageAvailable(): boolean {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function loadRecords(): AILatencyRecord[] {
  if (!isLocalStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AILatencyRecord[]) : [];
  } catch (err) {
    logError("LoadRecords", err);
    return [];
  }
}

function saveRecords(records: AILatencyRecord[]): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch (err) {
    logError("SaveRecords", err);
  }
}

export function trackAILatency(record: AILatencyRecord): void {
  const records = loadRecords();
  records.push({
    ...record,
    estimatedCost: record.estimatedCost ?? estimateCallCost(record.provider, record.callType),
  });
  saveRecords(records);
}

export function getAILatencyStats() {
  const records = loadRecords();
  if (records.length === 0) {
    return {
      totalCalls: 0,
      byProvider: {},
      averageLatencyMs: 0,
      successRate: 100,
      totalCostCents: 0,
    };
  }

  const byProvider: Record<
    string,
    {
      calls: number;
      successes: number;
      totalDurationMs: number;
      totalCostCents: number;
    }
  > = {};

  for (const r of records) {
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = {
        calls: 0,
        successes: 0,
        totalDurationMs: 0,
        totalCostCents: 0,
      };
    }
    byProvider[r.provider].calls++;
    if (r.success) byProvider[r.provider].successes++;
    byProvider[r.provider].totalDurationMs += r.durationMs;
    byProvider[r.provider].totalCostCents +=
      r.estimatedCost ?? estimateCallCost(r.provider, r.callType);
  }

  const totalCalls = records.length;
  const totalSuccesses = records.filter((r) => r.success).length;
  const totalDuration = records.reduce((s, r) => s + r.durationMs, 0);
  const totalCostCents = records.reduce(
    (s, r) => s + (r.estimatedCost ?? estimateCallCost(r.provider, r.callType)),
    0,
  );

  return {
    totalCalls,
    totalCostCents: Math.round(totalCostCents * 100) / 100,
    avgCostPerCallCents: totalCalls > 0 ? Math.round((totalCostCents / totalCalls) * 100) / 100 : 0,
    successRate: totalCalls > 0 ? Math.round((totalSuccesses / totalCalls) * 100) : 100,
    averageLatencyMs: totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0,
    recentCalls: records.slice(-50).reverse(),
    byProvider: Object.fromEntries(
      Object.entries(byProvider).map(([name, stats]) => [
        name,
        {
          ...stats,
          averageLatencyMs: stats.calls > 0 ? Math.round(stats.totalDurationMs / stats.calls) : 0,
          successRate: stats.calls > 0 ? Math.round((stats.successes / stats.calls) * 100) : 0,
          totalCostCents: Math.round(stats.totalCostCents * 100) / 100,
        },
      ]),
    ),
  };
}

export function clearAILatencyRecords(): void {
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    logError("ClearAILatencyRecords", err);
  }
}
