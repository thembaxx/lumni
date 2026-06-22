import { safeJsonParse, safeJsonStringify } from "@/lib/shared";
import { logError } from "@/lib/shared/logger";

export interface QualityRecord {
  timestamp: number;
  subject: string;
  topic?: string;
  questionType: string;
  validationScore: number;
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  provider?: string;
}

const QUALITY_KEY = "lumni_engine_quality";

export function recordQuality(data: Omit<QualityRecord, "timestamp">): void {
  if (typeof window === "undefined") return;
  const records = loadQualityRecords();
  records.push({ ...data, timestamp: Date.now() });
  const recent = records.slice(-200);
  try {
    localStorage.setItem(QUALITY_KEY, safeJsonStringify(recent));
  } catch (err) {
    logError("RecordQuality", err);
    try {
      localStorage.setItem(QUALITY_KEY, safeJsonStringify(recent.slice(-50)));
    } catch (innerErr) {
      logError("RecordQualityInner", innerErr);
    }
  }
}

export function loadQualityRecords(): QualityRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUALITY_KEY);
    return raw ? (safeJsonParse(raw, []) as QualityRecord[]) : [];
  } catch (err) {
    logError("LoadQualityRecords", err);
    return [];
  }
}

export function getQualityStats(): {
  total: number;
  avgScore: number;
  passRate: number;
  byType: Record<string, { count: number; avgScore: number }>;
} {
  const records = loadQualityRecords();
  if (records.length === 0) {
    return { total: 0, avgScore: 0, passRate: 0, byType: {} };
  }

  const byType: Record<string, { count: number; totalScore: number }> = {};
  for (const r of records) {
    if (!byType[r.questionType]) {
      byType[r.questionType] = { count: 0, totalScore: 0 };
    }
    byType[r.questionType].count++;
    byType[r.questionType].totalScore += r.validationScore;
  }

  const avgScore = Math.round(records.reduce((s, r) => s + r.validationScore, 0) / records.length);
  const passRate = Math.round((records.filter((r) => r.isValid).length / records.length) * 100);

  return {
    total: records.length,
    avgScore,
    passRate,
    byType: Object.fromEntries(
      Object.entries(byType).map(([type, stats]) => [
        type,
        {
          count: stats.count,
          avgScore: Math.round(stats.totalScore / stats.count),
        },
      ]),
    ),
  };
}

export function clearQualityRecords(): void {
  try {
    localStorage.removeItem(QUALITY_KEY);
  } catch (err) {
    logError("ClearQualityRecords", err);
  }
}
