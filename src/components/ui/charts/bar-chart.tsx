"use client";

import dynamic from "next/dynamic";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const RechartsBarChart = dynamic(() => import("recharts").then((m) => ({ default: m.BarChart })), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  {
    ssr: false,
  },
);
const XAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => ({ default: m.Bar })), {
  ssr: false,
});

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  config: ChartConfig;
  height?: number;
  showGrid?: boolean;
}

export function BarChart({
  data,
  xKey,
  yKey,
  config,
  height = 160,
  showGrid = false,
}: BarChartProps) {
  return (
    <ChartContainer config={config} className="w-full" style={{ height }}>
      <RechartsBarChart data={data} margin={{ top: 10, right: 10, bottom: 24, left: 10 }}>
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
      </RechartsBarChart>
    </ChartContainer>
  );
}
