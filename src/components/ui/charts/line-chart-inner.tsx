"use client";

import { LineChart, CartesianGrid, XAxis, YAxis, Line } from "recharts";
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
  // eslint-disable-next-line no-unused-vars
  height = 250,
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
