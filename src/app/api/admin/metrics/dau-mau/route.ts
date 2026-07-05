import { createRouteHandler } from "@/lib/api/create-route-handler";

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
    const daily: DailyDau[] = [];
    const monthly: MonthlyMau[] = [];
    const dauSet = new Set<string>();
    const mauSet = new Set<string>();

    for (let i = 0; i < 30; i++) {
      const d = new Date(now - i * dayMs);
      daily.push({ date: d.toISOString().slice(0, 10), dau: 0 });
    }
    daily.reverse();

    for (let i = 0; i < 12; i++) {
      const d = new Date(now - i * 30 * dayMs);
      monthly.push({ month: d.toISOString().slice(0, 7), mau: 0 });
    }
    monthly.reverse();

    const dau = dauSet.size;
    const mau = mauSet.size;
    const stickiness = mau > 0 ? dau / mau : 0;

    return { daily, monthly, stickiness };
  },
});
