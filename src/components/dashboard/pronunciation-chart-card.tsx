"use client";

import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { FadeIn } from "@/components/shared/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { getPronunciationStats } from "@/lib/pronunciation-history/service";

const PronunciationChartInner = dynamic(
  () => import("./pronunciation-chart-inner").then((m) => ({ default: m.PronunciationChartInner })),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 rounded-card" />,
  },
);

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
          <Skeleton className="h-48 rounded-card" />
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
          {stats.recentScores.length > 0 && <PronunciationChartInner stats={stats} />}
        </CardContent>
      </Card>
    </FadeIn>
  );
}
