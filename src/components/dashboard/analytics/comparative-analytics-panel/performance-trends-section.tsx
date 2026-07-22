"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts/line-chart";
import { cn } from "@/lib/utils";

interface SubjectTrendData {
  dates: string[];
  accuracies: number[];
  trend: "improving" | "declining" | "stable";
}

interface PerformanceTrendsSectionProps {
  subjectTrends: Record<string, SubjectTrendData>;
}

export function PerformanceTrendsSection({ subjectTrends }: PerformanceTrendsSectionProps) {
  if (Object.keys(subjectTrends).length === 0) return null;

  return (
    <Card size="sm" className="rounded-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg
              className="size-4 text-(--system-accent)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Performance trends</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
            </svg>
            <span>Performance Trends</span>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {Object.entries(subjectTrends).map(([subject, trendData]) => (
          <div key={subject}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-lg">{subject}</h3>
              <span
                className={cn(
                  "font-medium text-xs",
                  trendData.trend === "improving"
                    ? "text-success"
                    : trendData.trend === "declining"
                      ? "text-destructive"
                      : "text-muted-foreground",
                )}
              >
                {trendData.trend === "improving"
                  ? "Improving"
                  : trendData.trend === "declining"
                    ? "Declining"
                    : "Stable"}
              </span>
            </div>
            <LineChart
              data={trendData.dates.map((date, i) => ({
                date,
                accuracy: trendData.accuracies[i],
              }))}
              xKey="date"
              yKey="accuracy"
              config={{
                accuracy: {
                  label: "Accuracy %",
                  color: "var(--system-accent)",
                },
              }}
              height={192}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
