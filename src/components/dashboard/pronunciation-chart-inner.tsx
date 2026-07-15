"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

interface PronunciationStats {
  totalAttempts: number;
  averageScore: number;
  recentScores: { date: string; score: number }[];
}

export function PronunciationChartInner({ stats }: { stats: PronunciationStats }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={stats.recentScores}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--primary, oklch(52% 0.18 146))"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--primary, oklch(52% 0.18 146))" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
