"use client";

import dynamic from "next/dynamic";

const HistoryChartInner = dynamic(
  () => import("./history-chart-inner").then((m) => ({ default: m.HistoryChartInner })),
  { ssr: false },
);

interface HistoryStats {
  totalAttempts: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
  topWords: { word: string; count: number; avgScore: number }[];
}

export function HistoryChart({ stats, loading }: { stats: HistoryStats | null; loading: boolean }) {
  return <HistoryChartInner stats={stats} loading={loading} />;
}
