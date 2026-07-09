"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/shared/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getPronunciationStats } from "@/lib/pronunciation-history/service";

const Chart = dynamic(() => import("recharts").then((m) => m.LineChart), {
  ssr: false,
  loading: () => <Skeleton className="h-48 rounded-2xl" />,
});
const Line = dynamic(() => import("recharts").then((m) => m.Line), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((m) => m.Tooltip), { ssr: false });
const CartesianGrid = dynamic(() => import("recharts").then((m) => m.CartesianGrid), {
  ssr: false,
});
const ResponsiveContainer = dynamic(() => import("recharts").then((m) => m.ResponsiveContainer), {
  ssr: false,
});

export function PronunciationChartCard() {
  const { user } = useAuth();
  const userId = user?.$id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ["pronunciation-stats", userId],
    queryFn: () => getPronunciationStats(userId!),
    enabled: !!userId,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-lg">Pronunciation Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <Skeleton className="h-48 rounded-2xl" />
        </CardContent>
      </Card>
    );
  }

  if (!stats || stats.totalAttempts === 0) return null;

  return (
    <FadeIn direction="up" distance={16} duration={0.4}>
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-lg">Pronunciation Progress</CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="mb-3 flex items-center gap-4 text-muted-foreground text-xs">
            <span>{stats.totalAttempts} attempts</span>
            <span className="opacity-30">|</span>
            <span>Avg: {stats.averageScore}%</span>
          </div>
          {stats.recentScores.length > 0 && (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <Chart data={stats.recentScores}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    stroke="var(--muted-foreground)"
                  />
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
                </Chart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
