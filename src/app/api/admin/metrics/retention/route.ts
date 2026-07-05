import { createRouteHandler } from "@/lib/api/create-route-handler";

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
    const cohorts: CohortRow[] = [];
    const now = Date.now();
    const weekMs = 7 * 86400000;

    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now - i * weekMs);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);

      cohorts.push({
        weekStart: weekStart.toISOString().slice(0, 10),
        week0: 100,
        week1: 0,
        week2: 0,
        week3: 0,
        week4: 0,
      });
    }

    return { cohorts };
  },
});
