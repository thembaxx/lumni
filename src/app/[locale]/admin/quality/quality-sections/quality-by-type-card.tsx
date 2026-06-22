"use client";

import { Badge } from "@/components/ui/badge";

interface QualityByTypeCardProps {
  byType: Record<string, { count: number; avgScore: number }>;
}

export function QualityByTypeCard({ byType }: QualityByTypeCardProps) {
  const entries = Object.entries(byType) as [string, { count: number; avgScore: number }][];

  return (
    <div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
      <header>
        <h2 className="font-heading font-medium text-lg">Quality by Type</h2>
      </header>
      <div className="flex flex-col gap-2 px-4 group-data-[size=sm]/card:px-3">
        {entries.length === 0 && (
          <p className="text-muted-foreground text-sm">No quality data yet</p>
        )}
        {entries.map(([type, stats]) => (
          <div key={type} className="flex items-center justify-between text-sm">
            <Badge variant="outline" className="font-mono text-xs">
              {type}
            </Badge>
            <div className="flex gap-3">
              <span className="text-muted-foreground">{stats.count}x</span>
              <span
                className={`font-mono ${stats.avgScore >= 80 ? "text-success" : "text-warning"}`}
              >
                {stats.avgScore}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
