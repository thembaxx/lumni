"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";

const RechartsLineChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.LineChart })),
  { ssr: false },
);
const RechartsBarChart = dynamic(() => import("recharts").then((m) => ({ default: m.BarChart })), {
  ssr: false,
});
const RechartsLine = dynamic(() => import("recharts").then((m) => ({ default: m.Line })), {
  ssr: false,
});
const RechartsBar = dynamic(() => import("recharts").then((m) => ({ default: m.Bar })), {
  ssr: false,
});
const RechartsXAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), {
  ssr: false,
});
const RechartsYAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), {
  ssr: false,
});
const RechartsCartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  { ssr: false },
);
const RechartsTooltip = dynamic(() => import("recharts").then((m) => ({ default: m.Tooltip })), {
  ssr: false,
});
const RechartsResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false },
);

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

interface LiveResponse {
  liveUsers: number;
}

interface SubjectUsage {
  name: string;
  count: number;
}

interface SubjectsResponse {
  subjects: SubjectUsage[];
}

export function AdminMetricsDashboard() {
  const { data: dauMau } = useQuery<DauMauResponse>({
    queryKey: ["admin-metrics-dau-mau"],
    queryFn: async () => {
      const res = await fetch("/api/admin/metrics/dau-mau");
      if (!res.ok) throw new Error("Failed to fetch DAU/MAU");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: live } = useQuery<LiveResponse>({
    queryKey: ["admin-metrics-live"],
    queryFn: async () => {
      const res = await fetch("/api/admin/metrics/live");
      if (!res.ok) throw new Error("Failed to fetch live users");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const { data: subjects } = useQuery<SubjectsResponse>({
    queryKey: ["admin-metrics-subjects"],
    queryFn: async () => {
      const res = await fetch("/api/admin/metrics/subjects");
      if (!res.ok) throw new Error("Failed to fetch subject usage");
      return res.json();
    },
  });

  const daily = dauMau?.daily ?? [];
  const stickiness = dauMau?.stickiness ?? 0;
  const liveUsers = live?.liveUsers ?? 0;
  const dau = daily.length > 0 ? daily[daily.length - 1].dau : 0;
  const mau = dauMau?.monthly?.length ? dauMau.monthly[dauMau.monthly.length - 1].mau : 0;

  return (
    <div id="admin-metrics" className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Business Metrics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="DAU" value={dau} variant="admin" delay={0} />
            <StatCard label="MAU" value={mau} variant="admin" delay={0.05} />
            <StatCard
              label="Stickiness"
              value={`${(stickiness * 100).toFixed(1)}%`}
              variant="admin"
              delay={0.1}
            />
            <StatCard label="Live Now" value={liveUsers} variant="admin" delay={0.15} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>DAU (30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <RechartsResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={daily}>
                      <RechartsCartesianGrid strokeDasharray="3 3" />
                      <RechartsXAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <RechartsYAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <RechartsLine
                        type="monotone"
                        dataKey="dau"
                        stroke="var(--color-accent)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </RechartsLineChart>
                  </RechartsResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Subject Usage (this month)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <RechartsResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={subjects?.subjects ?? []}>
                      <RechartsCartesianGrid strokeDasharray="3 3" />
                      <RechartsXAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <RechartsYAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <RechartsBar
                        dataKey="count"
                        fill="var(--color-accent)"
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </RechartsResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
