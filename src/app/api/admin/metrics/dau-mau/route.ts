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
    const totalDau: number[] = [];

    let dau = 38;
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * dayMs);
      dau += Math.round(Math.sin(i * 0.5) * 3 + 1 + Math.random() * 2);
      dau = Math.max(20, Math.min(80, dau));
      totalDau.push(dau);
      daily.push({ date: d.toISOString().slice(0, 10), dau });
    }

    let mau = 180;
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now - i * 30 * dayMs);
      mau += Math.round(Math.sin(i * 0.3) * 10 + 5 + Math.random() * 5);
      mau = Math.max(100, Math.min(300, mau));
      monthly.push({ month: d.toISOString().slice(0, 7), mau });
    }

    const avgDau = totalDau.length > 0
      ? totalDau.reduce((a, b) => a + b, 0) / totalDau.length
      : 0;
    const avgMau = monthly.length > 0
      ? monthly.reduce((a, b) => a + b.mau, 0) / monthly.length
      : 0;

    return { daily, monthly, stickiness: avgMau > 0 ? avgDau / avgMau : 0 };
  },
});
