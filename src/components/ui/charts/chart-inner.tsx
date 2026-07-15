"use client";

import {
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface LineChartInnerProps<T extends object> {
  data: T[];
  xKey: string;
  yKey: string;
  config: ChartConfig;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
}

export function LineChartInner<T extends object>({
  data,
  xKey,
  yKey,
  // biome-ignore lint/correctness/noUnusedVariables: passed to ChartContainer via outer component
  height: _height = 250,
  showGrid = true,
  showDots = true,
}: LineChartInnerProps<T>) {
  return (
    <LineChart data={data} margin={{ top: 10, right: 10, bottom: 24, left: 28 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
      <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} tickCount={5} />
      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
      <Line
        dataKey={yKey}
        type="monotone"
        stroke={`var(--color-${yKey})`}
        strokeWidth={2}
        dot={showDots ? { r: 4, strokeWidth: 2 } : false}
        activeDot={{ r: 6, strokeWidth: 2 }}
        animationDuration={300}
      />
    </LineChart>
  );
}

interface BarChartInnerProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  config: ChartConfig;
  height?: number;
  showGrid?: boolean;
}

export function BarChartInner({
  data,
  xKey,
  yKey,
  // biome-ignore lint/correctness/noUnusedVariables: passed to ChartContainer via outer component
  height: _height = 160,
  showGrid = false,
}: BarChartInnerProps) {
  return (
    <BarChart data={data} margin={{ top: 10, right: 10, bottom: 24, left: 10 }}>
      {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
      <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} />
      <YAxis hide />
      <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" hideLabel />} />
      <Bar
        dataKey={yKey}
        fill={`var(--color-${yKey})`}
        radius={[4, 4, 0, 0]}
        animationDuration={300}
      />
    </BarChart>
  );
}

interface RadarChartInnerProps {
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string;
      borderColor?: string;
    }>;
  };
}

export function RadarChartInner({ data }: RadarChartInnerProps) {
  const chartData = data.labels.map((label, i) => {
    const point: Record<string, string | number> = { label };
    for (const ds of data.datasets) {
      point[ds.label] = ds.data[i] ?? 0;
    }
    return point;
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData}>
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
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
