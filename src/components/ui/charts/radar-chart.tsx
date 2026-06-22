"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

const RechartsRadarChart = dynamic(() => import("recharts").then((m) => m.RadarChart), {
  ssr: false,
});
const PolarGrid = dynamic(() => import("recharts").then((m) => m.PolarGrid), {
  ssr: false,
});
const PolarAngleAxis = dynamic(() => import("recharts").then((m) => m.PolarAngleAxis), {
  ssr: false,
});
const PolarRadiusAxis = dynamic(() => import("recharts").then((m) => m.PolarRadiusAxis), {
  ssr: false,
});
const Radar = dynamic(() => import("recharts").then((m) => m.Radar), {
  ssr: false,
});
const Legend = dynamic(() => import("recharts").then((m) => m.Legend), {
  ssr: false,
});
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

interface RadarChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
  className?: string;
}

export function RadarChart({ data, className }: RadarChartProps) {
  const chartData = useMemo(() => {
    return data.labels.map((label, i) => {
      const point: Record<string, string | number> = { label };
      for (const ds of data.datasets) {
        point[ds.label] = ds.data[i] ?? 0;
      }
      return point;
    });
  }, [data]);

  return (
    <div className={cn("h-64 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={chartData}>
          <PolarGrid />
          <PolarAngleAxis dataKey="label" />
          <PolarRadiusAxis />
          {data.datasets.map((ds) => (
            <Radar
              key={ds.label}
              name={ds.label}
              dataKey={ds.label}
              stroke={ds.borderColor ?? "var(--system-accent)"}
              fill={ds.backgroundColor ?? "var(--system-accent)"}
              fillOpacity={0.3}
            />
          ))}
          <Legend />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
