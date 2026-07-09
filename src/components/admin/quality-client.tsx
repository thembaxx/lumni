"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { QuestionRatingsDashboard } from "@/components/admin/question-ratings-dashboard";
import { StatsCardsGrid } from "@/components/admin/quality-stats-cards";
import { RequestsBreakdownCard } from "@/components/admin/quality-requests-breakdown";
import { QualityByTypeCard } from "@/components/admin/quality-by-type";
import { RecentEventsCard } from "@/components/admin/quality-recent-events";
import { RecentQualityRecordsCard } from "@/components/admin/quality-recent-records";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearAnalytics, getAnalyticsSummary, loadEvents } from "@/lib/utils/engine-analytics";
import {
  clearQualityRecords,
  getQualityStats,
  loadQualityRecords,
} from "@/lib/utils/engine-quality";

export default function AdminQualityPage() {
  const { data: quality = getQualityStats(), isError: qualityErr } = useQuery({
    queryKey: ["engine-quality", "stats"],
    queryFn: () => getQualityStats(),
    refetchInterval: 5000,
  });

  const { data: analytics = getAnalyticsSummary(), isError: analyticsErr } = useQuery({
    queryKey: ["engine-quality", "analytics-summary"],
    queryFn: () => getAnalyticsSummary(),
    refetchInterval: 5000,
  });

  const {
    data: events = loadEvents()
      .toReversed()
      .map((e) => ({ type: e.event, timestamp: e.timestamp, subject: e.subject }))
      .slice(0, 20),
    isError: eventsErr,
  } = useQuery({
    queryKey: ["engine-quality", "events"],
    queryFn: () =>
      loadEvents()
        .reverse()
        .map((e) => ({ type: e.event, timestamp: e.timestamp, subject: e.subject }))
        .slice(0, 20),
    refetchInterval: 5000,
  });

  const {
    data: recentQuality = loadQualityRecords()
      .toReversed()
      .map((r) => ({
        questionType: r.questionType,
        score: r.validationScore,
        timestamp: r.timestamp,
      }))
      .slice(0, 10),
    isError: recentErr,
  } = useQuery({
    queryKey: ["engine-quality", "recent"],
    queryFn: () =>
      loadQualityRecords()
        .reverse()
        .map((r) => ({
          questionType: r.questionType,
          score: r.validationScore,
          timestamp: r.timestamp,
        }))
        .slice(0, 10),
    refetchInterval: 5000,
  });

  const queryClient = useQueryClient();

  const handleClear = useCallback(() => {
    clearAnalytics();
    clearQualityRecords();
    queryClient.invalidateQueries({ queryKey: ["engine-quality"] });
  }, [queryClient]);

  return (
    <div className={cn("mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 bg-background p-6")}>
      <div className={cn("flex items-center justify-between")}>
        <h1 className={cn("font-bold text-2xl")}>Engine Quality & Analytics</h1>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear Data
        </Button>
      </div>

      {(qualityErr || analyticsErr || eventsErr || recentErr) && (
        <div
          className={cn(
            "rounded-card-lg border border-destructive/60 bg-destructive/5 p-4 text-destructive text-sm",
          )}
        >
          Failed to load quality data. Some sections may be incomplete.
        </div>
      )}

      <StatsCardsGrid
        totalRequests={analytics.totalRequests}
        successRate={analytics.successRate}
        avgScore={quality.avgScore}
        passRate={quality.passRate}
      />

      <div className={cn("grid grid-cols-2 gap-6")}>
        <RequestsBreakdownCard
          generateCount={analytics.generateCount}
          gradeCount={analytics.gradeCount}
          hintCount={analytics.hintCount}
        />

        <QualityByTypeCard byType={quality.byType} />
      </div>

      <RecentEventsCard events={events} />

      <RecentQualityRecordsCard records={recentQuality} />

      <div
        className={cn(
          "overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 p-6 transition-colors",
        )}
      >
        <h2 className={cn("font-heading font-medium text-lg mb-4")}>Question Ratings</h2>
        <QuestionRatingsDashboard />
      </div>
    </div>
  );
}
