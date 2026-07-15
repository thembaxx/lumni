"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const RadarChartInner = dynamic(
  () => import("./chart-inner").then((m) => ({ default: m.RadarChartInner })),
  {
    ssr: false,
  },
);

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
  return (
    <div className={cn("h-64 w-full", className)}>
      <RadarChartInner data={data} />
    </div>
  );
}
