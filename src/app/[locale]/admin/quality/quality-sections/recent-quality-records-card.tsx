"use client";

import { Badge } from "@/components/ui/badge";

interface QualityRecord {
  validationScore: number;
  isValid: boolean;
  questionType: string;
  subject: string;
  timestamp: string | number;
}

interface RecentQualityRecordsCardProps {
  records: QualityRecord[];
}

function Timestamp({ time }: { time: string | number }) {
  return <span className="text-muted-foreground">{new Date(time).toLocaleTimeString()}</span>;
}

export function RecentQualityRecordsCard({ records }: RecentQualityRecordsCardProps) {
  return (
    <div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
      <header>
        <h2 className="font-heading font-medium text-lg">Recent Quality Records</h2>
      </header>
      <div className="px-4 group-data-[size=sm]/card:px-3">
        {records.length === 0 ? (
          <p className="text-muted-foreground text-sm">No quality data yet</p>
        ) : (
          <div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
            {records.map((r) => (
              <div
                key={`${r.questionType}-${r.timestamp}`}
                className="flex items-center gap-2 font-mono text-xs"
              >
                <Badge
                  variant={r.isValid ? "secondary" : "destructive"}
                  className="ios-caption-3 px-1 py-0"
                >
                  {r.validationScore}
                </Badge>
                <span className="text-muted-foreground">{r.questionType}</span>
                <span className="text-muted-foreground">{r.subject}</span>
                <span className="ml-auto text-muted-foreground">
                  <Timestamp time={r.timestamp} />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
