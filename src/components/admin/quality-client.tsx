"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { QuestionRatingsDashboard } from "@/components/admin/question-ratings-dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { clearAnalytics, getAnalyticsSummary, loadEvents } from "@/lib/utils/engine-analytics";
import {
  clearQualityRecords,
  getQualityStats,
  loadQualityRecords,
} from "@/lib/utils/engine-quality";

function StatsCardsGrid({
  totalRequests,
  successRate,
  avgScore,
  passRate,
}: {
  totalRequests: number;
  successRate: number;
  avgScore: number;
  passRate: number;
}) {
  return (
    <div className={cn("grid", "grid-cols-4", "gap-4")}>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Total Requests</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{totalRequests}</p>
      </div>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Success Rate</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{successRate}%</p>
      </div>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Avg Quality</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{avgScore}/100</p>
      </div>
      <div
        className={cn(
          "rounded-card-lg",
          "border",
          "border-border/80",
          "bg-card",
          "p-4",
          "shadow-level-2",
        )}
      >
        <p className={cn("text-muted-foreground", "text-sm")}>Pass Rate</p>
        <p className={cn("font-bold", "text-3xl", "tabular-nums")}>{passRate}%</p>
      </div>
    </div>
  );
}

function RequestsBreakdownCard({
  generateCount,
  gradeCount,
  hintCount,
}: {
  generateCount: number;
  gradeCount: number;
  hintCount: number;
}) {
  const total = generateCount + gradeCount + hintCount;
  return (
    <div
      className={cn(
        "overflow-hidden",
        "rounded-card-lg",
        "border",
        "border-border/80",
        "bg-card",
        "p-6",
        "shadow-level-2",
        "transition-colors",
      )}
    >
      <h2 className={cn("font-heading", "font-medium", "text-lg", "mb-4")}>Requests Breakdown</h2>
      <div className={cn("flex flex-col gap-3")}>
        {[
          { label: "Generate", count: generateCount, color: "bg-blue-500" },
          { label: "Grade", count: gradeCount, color: "bg-green-500" },
          { label: "Hint", count: hintCount, color: "bg-amber-500" },
        ].map(({ label, count, color }) => (
          <div key={label} className={cn("flex items-center gap-3")}>
            <div className={cn("h-2 w-24 rounded-full bg-muted")}>
              <div
                className={cn("h-full rounded-full", color)}
                style={{ width: total > 0 ? `${(count / total) * 100}%` : "0%" }}
              />
            </div>
            <span className={cn("w-16 font-medium text-sm")}>{label}</span>
            <span className={cn("font-mono text-muted-foreground text-sm tabular-nums")}>
              {count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QualityByTypeCard({
  byType,
}: {
  byType: Record<string, { count: number; avgScore: number }>;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        "rounded-card-lg",
        "border",
        "border-border/80",
        "bg-card",
        "p-6",
        "shadow-level-2",
        "transition-colors",
      )}
    >
      <h2 className={cn("font-heading", "font-medium", "text-lg", "mb-4")}>Quality by Type</h2>
      {Object.keys(byType).length === 0 ? (
        <p className={cn("text-muted-foreground", "text-sm")}>No data yet.</p>
      ) : (
        <div className={cn("flex flex-col gap-2")}>
          {Object.entries(byType).map(([type, stats]) => (
            <div key={type} className={cn("flex items-center justify-between")}>
              <span className={cn("text-sm capitalize")}>{type.replace(/_/g, " ")}</span>
              <span className={cn("font-mono text-sm tabular-nums")}>
                {stats.count} ({stats.avgScore.toFixed(0)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentEventsCard({
  events,
}: {
  events: Array<{ type: string; timestamp: number; subject?: string }>;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        "rounded-card-lg",
        "border",
        "border-border/80",
        "bg-card",
        "shadow-level-2",
        "transition-colors",
      )}
    >
      <div className={cn("border-border/60", "border-b", "p-4")}>
        <h2 className={cn("font-heading", "font-medium")}>Recent Events</h2>
      </div>
      {events.length === 0 ? (
        <div className={cn("p-4", "text-muted-foreground", "text-sm")}>No events recorded yet.</div>
      ) : (
        <div className={cn("flex flex-col")}>
          {events.map((ev, i) => (
            <div
              key={`${ev.timestamp}-${i}`}
              className={cn(
                "flex items-center gap-2 border-border/40 border-b px-4 py-2 text-xs last:border-b-0",
              )}
            >
              <span className={cn("w-24 font-mono text-muted-foreground tabular-nums")}>
                {new Date(ev.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn("w-20 text-muted-foreground capitalize")}>
                {ev.type.replace(/_/g, " ")}
              </span>
              {ev.subject && <span className={cn("text-muted-foreground")}>{ev.subject}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RecentQualityRecordsCard({
  records,
}: {
  records: Array<{ questionType?: string; score: number; timestamp: number }>;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden",
        "rounded-card-lg",
        "border",
        "border-border/80",
        "bg-card",
        "shadow-level-2",
        "transition-colors",
      )}
    >
      <div className={cn("border-border/60", "border-b", "p-4")}>
        <h2 className={cn("font-heading", "font-medium")}>Recent Quality Records</h2>
      </div>
      {records.length === 0 ? (
        <div className={cn("p-4", "text-muted-foreground", "text-sm")}>No quality records yet.</div>
      ) : (
        <div className={cn("flex flex-col")}>
          {records.map((r, i) => (
            <div
              key={`${r.timestamp}-${i}`}
              className={cn(
                "flex items-center gap-2 border-border/40 border-b px-4 py-2 text-xs last:border-b-0",
              )}
            >
              <span className={cn("w-24 font-mono text-muted-foreground tabular-nums")}>
                {new Date(r.timestamp).toLocaleTimeString()}
              </span>
              <span className={cn("w-20 text-muted-foreground capitalize")}>
                {r.questionType?.replace(/_/g, " ") ?? "unknown"}
              </span>
              <span
                className={cn(
                  "font-mono tabular-nums",
                  r.score >= 80
                    ? "text-success"
                    : r.score >= 50
                      ? "text-amber-500"
                      : "text-destructive",
                )}
              >
                {r.score}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        <h1 className={cn("font-extrabold text-2xl")}>Engine Quality & Analytics</h1>
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
