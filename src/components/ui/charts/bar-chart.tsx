"use client";

import dynamic from "next/dynamic";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const ChartInner = dynamic(
  () => import("./chart-inner").then((m) => ({ default: m.BarChartInner })),
  {
    ssr: false,
  },
);

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  yKey: string;
  config: ChartConfig;
  height?: number;
  showGrid?: boolean;
}

export function BarChart(props: BarChartProps) {
  return (
    <ChartContainer
      config={props.config}
      className="w-full"
      style={{ height: props.height ?? 160 }}
    >
      {/* @ts-expect-error — dynamic() wrapper loses inner component type info */}
      <ChartInner {...(props as unknown as Record<string, unknown>)} />
    </ChartContainer>
  );
}
