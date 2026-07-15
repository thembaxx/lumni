"use client";

import {
  LineChart,
  BarChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DailyDau {
  date: string;
  dau: number;
}

interface SubjectUsage {
  name: string;
  count: number;
}

export function AdminMetricsDashboardChart({
  daily,
  subjects,
}: {
  daily: DailyDau[];
  subjects: SubjectUsage[];
}) {
  return (
    <>
      <div className="rounded-card border border-border bg-card">
        <div className="px-6 pt-6 pb-4">
          <h3 className="font-semibold text-lg">DAU (30 days)</h3>
        </div>
        <div className="px-6 pb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="dau"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-card">
        <div className="px-6 pt-6 pb-4">
          <h3 className="font-semibold text-lg">Subject Usage (this month)</h3>
        </div>
        <div className="px-6 pb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjects}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
