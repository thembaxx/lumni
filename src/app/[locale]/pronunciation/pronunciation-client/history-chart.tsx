"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const RechartsBarChart = dynamic(() => import("recharts").then((m) => ({ default: m.BarChart })), {
  ssr: false,
});
const RechartsLineChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.LineChart })),
  { ssr: false },
);
const RechartsBar = dynamic(() => import("recharts").then((m) => ({ default: m.Bar })), {
  ssr: false,
});
const RechartsLine = dynamic(() => import("recharts").then((m) => ({ default: m.Line })), {
  ssr: false,
});
const RechartsXAxis = dynamic(() => import("recharts").then((m) => ({ default: m.XAxis })), {
  ssr: false,
});
const RechartsYAxis = dynamic(() => import("recharts").then((m) => ({ default: m.YAxis })), {
  ssr: false,
});
const RechartsTooltip = dynamic(() => import("recharts").then((m) => ({ default: m.Tooltip })), {
  ssr: false,
});
const RechartsResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false },
);

interface HistoryStats {
  totalAttempts: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
  topWords: { word: string; count: number; avgScore: number }[];
}

export function HistoryChart({ stats, loading }: { stats: HistoryStats | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-8 w-24 rounded-2xl" />
        <Skeleton className="h-4 w-48 rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-3xl" />
      </div>
    );
  }

  if (!stats || stats.totalAttempts === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No pronunciation history yet. Practice some words to see your progress!
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card p-4 text-center">
          <div className="font-bold text-3xl tabular-nums">{stats.totalAttempts}</div>
          <div className="mt-1 text-muted-foreground text-xs">Total Attempts</div>
        </div>
        <div className="rounded-2xl bg-card p-4 text-center">
          <div className="font-bold text-3xl tabular-nums">{stats.averageScore}%</div>
          <div className="mt-1 text-muted-foreground text-xs">Average Score</div>
        </div>
      </div>

      {stats.recentScores.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-sm">Score Trend</span>
          <RechartsResponsiveContainer width="100%" height={160}>
            <RechartsBarChart data={stats.recentScores} barCategoryGap="20%">
              <RechartsXAxis dataKey="date" tick={{ fontSize: 10 }} />
              <RechartsYAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <RechartsTooltip />
              <RechartsBar
                dataKey="score"
                radius={[4, 4, 0, 0]}
                fill="var(--color-accent, var(--system-accent))"
              />
            </RechartsBarChart>
          </RechartsResponsiveContainer>
          <RechartsResponsiveContainer width="100%" height={80}>
            <RechartsLineChart data={stats.recentScores}>
              <RechartsXAxis dataKey="date" hide />
              <RechartsYAxis domain={[0, 100]} hide />
              <RechartsLine
                type="monotone"
                dataKey="score"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </RechartsLineChart>
          </RechartsResponsiveContainer>
        </div>
      )}

      {stats.topWords.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-sm">Most Practiced Words</span>
          <div className="flex flex-wrap gap-2">
            {stats.topWords.map((w) => (
              <span
                key={w.word}
                className="inline-flex items-center rounded-full border px-3 py-1 text-xs"
              >
                {w.word} &mdash; {w.count}x ({w.avgScore}%)
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
