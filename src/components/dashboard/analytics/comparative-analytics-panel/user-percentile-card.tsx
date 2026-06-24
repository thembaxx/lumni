"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserPercentileCardProps {
  userPercentile: number;
  globalAverage: number;
  userAverage: number;
}

export function UserPercentileCard({
  userPercentile,
  globalAverage,
  userAverage,
}: UserPercentileCardProps) {
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
              <title>Performance percentile</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4M7.5 10a4.5 4.5 0 013-3 4.5 4.5 0 013 3 4.5 4.5 0 01-3 3 4.5 4.5 0 01-3-3z"
              />
            </svg>
            <span>Your Performance Percentile</span>
          </span>
          <span className="font-extrabold text-2xl">{userPercentile}%</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-muted-foreground text-sm">
          You scored better than {userPercentile}% of users
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Global Average:</span>
          <span className="font-mono text-xs">{globalAverage}%</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-muted-foreground text-xs">Your Average:</span>
          <span className="font-mono text-xs">{userAverage.toFixed(1)}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
