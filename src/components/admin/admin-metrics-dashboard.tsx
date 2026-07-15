"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";

const AdminMetricsDashboardChart = dynamic(
  () =>
    import("./admin-metrics-dashboard-chart").then((m) => ({
      default: m.AdminMetricsDashboardChart,
    })),
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
            <AdminMetricsDashboardChart daily={daily} subjects={subjects?.subjects ?? []} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
