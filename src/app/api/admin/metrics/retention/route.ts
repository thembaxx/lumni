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

function retentionAtWeek(week: number): number {
  return Math.round(100 * Math.pow(0.58 + Math.random() * 0.06, week));
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
        week1: retentionAtWeek(1),
        week2: retentionAtWeek(2),
        week3: retentionAtWeek(3),
        week4: retentionAtWeek(4),
      });
    }

    return { cohorts };
  },
});
