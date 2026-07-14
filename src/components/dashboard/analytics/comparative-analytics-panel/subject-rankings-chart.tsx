"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadarChart } from "@/components/ui/charts/radar-chart";

interface SubjectRankingsChartProps {
  subjectRankings: Record<string, number>;
  userAverage: number;
}

export function SubjectRankingsChart({ subjectRankings, userAverage }: SubjectRankingsChartProps) {
  const [showSubjectDetail, setShowSubjectDetail] = useState(false);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg
              className="size-4 text-(--system-accent)"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Subject performance comparison</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c4 0 6 4 6 4s-2 4-6 4-6-4-6-4 0-4 6-4zm0 0v8l4-2-4-2zm0 0V8l-4 2 4 2z"
              />
            </svg>
            <span>Subject Performance Comparison</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSubjectDetail((v) => !v)}
            aria-label="Toggle subject details"
          >
            <svg
              className="size-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <title>Toggle details</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5h6M5 9h6m6 6h6m6-6h6"
              />
            </svg>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showSubjectDetail && (
          <div className="mb-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th scope="col" className="py-1 pr-2 text-left">
                    Subject
                  </th>
                  <th scope="col" className="px-2 py-1 text-right">
                    Accuracy
                  </th>
                  <th scope="col" className="py-1 pl-2 text-right">
                    Rank
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(subjectRankings)
                  .toSorted(([, a], [, b]) => b - a)
                  .map(([subject, rank]) => {
                    const accuracy = userAverage;
                    return (
                      <tr key={subject} className="border-b last:border-0">
                        <td className="py-1 pr-2 font-medium">{subject}</td>
                        <td className="px-2 py-1 text-right">{Math.round(accuracy)}%</td>
                        <td className="py-1 pl-2 text-right">{rank}th</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
        <RadarChart
          data={{
            labels: Object.keys(subjectRankings),
            datasets: [
              {
                label: "Your Performance",
                data: Object.values(subjectRankings).map((rank) => Math.min(100, rank * 2)),
                backgroundColor: "color-mix(in oklch, var(--system-accent) 20%, transparent)",
                borderColor: "var(--system-accent)",
              },
              {
                label: "Average User",
                data: Object.keys(subjectRankings).map(() => 50),
                backgroundColor: "color-mix(in oklch, var(--system-muted) 10%, transparent)",
                borderColor: "var(--system-muted)",
              },
            ],
          }}
        />
      </CardContent>
    </Card>
  );
}
