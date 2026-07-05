"use client";

import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

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
          <div className="font-extrabold text-3xl tabular-nums">{stats.totalAttempts}</div>
          <div className="mt-1 text-muted-foreground text-xs">Total Attempts</div>
        </div>
        <div className="rounded-2xl bg-card p-4 text-center">
          <div className="font-extrabold text-3xl tabular-nums">{stats.averageScore}%</div>
          <div className="mt-1 text-muted-foreground text-xs">Average Score</div>
        </div>
      </div>

      {stats.recentScores.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-sm">Score Trend</span>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={stats.recentScores} barCategoryGap="20%">
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar
                dataKey="score"
                radius={[4, 4, 0, 0]}
                fill="var(--color-accent, oklch(52% 0.18 146))"
              />
            </BarChart>
          </ResponsiveContainer>
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={stats.recentScores}>
              <XAxis dataKey="date" hide />
              <YAxis domain={[0, 100]} hide />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--color-accent)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
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
