import { createRouteHandler } from "@/lib/api/create-route-handler";
import { Query } from "appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

interface DailyDau {
  date: string;
  dau: number;
}

interface MonthlyMau {
  month: string;
  mau: number;
}

interface DauMauResponse {
  daily: DailyDau[];
  monthly: MonthlyMau[];
  stickiness: number;
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "MetricsDauMau",
  execute: async (): Promise<DauMauResponse> => {
    const now = Date.now();
    const dayMs = 86400000;
    const thirtyDaysAgo = new Date(now - 30 * dayMs).toISOString();

    const sessions = await listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [
      Query.greaterThan("startedAt", thirtyDaysAgo),
    ]);

    // Build day buckets for DAU (last 30 days)
    const dayBuckets: Record<string, Set<string>> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      dayBuckets[d.toISOString().slice(0, 10)] = new Set();
    }

    // Build month buckets for MAU (last 12 months)
    const nowDate = new Date();
    const monthBuckets: Record<string, Set<string>> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
      monthBuckets[d.toISOString().slice(0, 7)] = new Set();
    }

    for (const s of sessions) {
      const startedAt = s.startedAt as string | undefined;
      if (!startedAt) continue;
      const userId = String(s.userId ?? "");
      if (!userId) continue;

      const dayKey = startedAt.slice(0, 10);
      if (dayBuckets[dayKey]) {
        dayBuckets[dayKey].add(userId);
      }

      const monthKey = startedAt.slice(0, 7);
      if (monthBuckets[monthKey]) {
        monthBuckets[monthKey].add(userId);
      }
    }

    const daily: DailyDau[] = Object.entries(dayBuckets)
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([date, users]) => ({ date, dau: users.size }));

    const monthly: MonthlyMau[] = Object.entries(monthBuckets)
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([month, users]) => ({ month, mau: users.size }));

    const avgDau = daily.length > 0 ? daily.reduce((sum, d) => sum + d.dau, 0) / daily.length : 0;
    const avgMau =
      monthly.length > 0 ? monthly.reduce((sum, m) => sum + m.mau, 0) / monthly.length : 0;

    return { daily, monthly, stickiness: avgMau > 0 ? avgDau / avgMau : 0 };
  },
});
