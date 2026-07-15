"use client";

import dynamic from "next/dynamic";
import { type ChartConfig, ChartContainer } from "@/components/ui/chart";

const ChartInner = dynamic(
  () => import("./chart-inner").then((m) => ({ default: m.LineChartInner })),
  {
    ssr: false,
  },
);

interface LineChartProps<T extends object> {
  data: T[];
  xKey: string;
  yKey: string;
  config: ChartConfig;
  height?: number;
  showGrid?: boolean;
  showDots?: boolean;
}

export function LineChart<T extends object>(props: LineChartProps<T>) {
  return (
    <ChartContainer
      config={props.config}
      className="w-full"
      style={{ height: props.height ?? 250 }}
    >
      {/* @ts-expect-error — dynamic() wrapper loses inner component type info */}
      <ChartInner {...(props as unknown as Record<string, unknown>)} />
    </ChartContainer>
  );
}
