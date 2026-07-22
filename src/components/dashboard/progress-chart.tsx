"use client";

import Chart03Icon from "@hugeicons/core-free-icons/Chart03Icon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts/line-chart";
import { useRouter } from "@/i18n/navigation";

interface ProgressDataPoint {
  date: string;
  accuracy: number;
}

const CHART_CONFIG = {
  accuracy: {
    label: "Accuracy",
    color: "var(--primary)",
  },
} as const;

interface ProgressChartProps {
  data: ProgressDataPoint[];
  title?: string;
}

export function ProgressChart({ data, title }: ProgressChartProps) {
  const { push } = useRouter();
  const chartConfig = CHART_CONFIG;

  return (
    <Card className="w-full overflow-hidden rounded-card">
      {title && (
        <CardHeader>
          <CardTitle className="balance text-wrap font-semibold text-lg">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {data.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
              <HugeiconsIcon icon={Chart03Icon} className="size-5 text-muted-foreground" />
            </div>
            <p className="mb-1 font-semibold text-foreground text-sm">Your accuracy over time</p>
            <p className="mb-4 max-w-50 text-pretty text-muted-foreground text-xs">
              Complete a quiz to start tracking your performance.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="min-h-10 gap-1.5 text-xs press-scale"
              onClick={() => push("/quiz")}
            >
              <HugeiconsIcon icon={PlayFreeIcons} data-icon="inline-start" />
              Take a quiz
            </Button>
          </div>
        ) : (
          <LineChart data={data} xKey="date" yKey="accuracy" config={chartConfig} />
        )}
      </CardContent>
    </Card>
  );
}
