import { createRouteHandler } from "@/lib/api/create-route-handler";
import { Query } from "appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

interface CohortRow {
  weekStart: string;
  week0: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

interface RetentionResponse {
  cohorts: CohortRow[];
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "MetricsRetention",
  execute: async (): Promise<RetentionResponse> => {
    const now = Date.now();
    const dayMs = 86400000;
    const weekMs = 7 * dayMs;
    const twelveWeeksAgo = new Date(now - 12 * weekMs).toISOString();

    const sessions = await listDocuments<Record<string, unknown>>(COLLECTIONS.STUDY_SESSIONS, [
      Query.greaterThan("startedAt", twelveWeeksAgo),
    ]);

    // Map sessions to week buckets (0 = current week, 7 = 7 weeks ago)
    const weekUsers: Record<number, Set<string>> = {};
    for (let i = 0; i < 8; i++) {
      weekUsers[i] = new Set();
    }

    for (const s of sessions) {
      const startedAt = s.startedAt as string | undefined;
      if (!startedAt) continue;
      const userId = String(s.userId ?? "");
      if (!userId) continue;
      const daysAgo = Math.floor((now - new Date(startedAt).getTime()) / dayMs);
      const weekIndex = Math.min(Math.floor(daysAgo / 7), 7);
      if (weekIndex >= 0 && weekIndex < 8) {
        weekUsers[weekIndex].add(userId);
      }
    }

    // Build cohort retention: each week is a cohort, track return rate in subsequent weeks
    const cohorts: CohortRow[] = [];
    for (let i = 0; i < 8; i++) {
      const cohort = weekUsers[i];
      const cohortSize = cohort.size;
      if (cohortSize === 0) continue;

      const weekStart = new Date(now - i * weekMs);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);

      const retained = (offset: number) =>
        i + offset < 8 && cohortSize > 0
          ? Math.round(
              ([...cohort].filter((u) => weekUsers[i + offset].has(u)).length / cohortSize) * 100,
            )
          : 0;

      cohorts.push({
        weekStart: weekStart.toISOString().slice(0, 10),
        week0: 100,
        week1: retained(1),
        week2: retained(2),
        week3: retained(3),
        week4: retained(4),
      });
    }

    return { cohorts };
  },
});
