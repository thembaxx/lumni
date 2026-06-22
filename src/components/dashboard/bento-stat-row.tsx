"use client";

import { DailyProgressRing } from "@/components/dashboard/daily-progress-ring";
import { SectionReveal } from "@/components/dashboard/section-reveal";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Card, CardContent } from "@/components/ui/card";

export function BentoStatRow({
  questionsAnswered,
  streak,
}: {
  questionsAnswered: number;
  streak: number;
}) {
  return (
    <div className="grid grid-cols-12 gap-3">
      <div className="col-span-12 sm:col-span-8">
        <StatsCards questionsAnswered={questionsAnswered} streak={streak} />
      </div>
      <div className="col-span-12 sm:col-span-4">
        <SectionReveal delay={0.12}>
          <Card className="flex h-full items-center justify-center rounded-4xl shadow-level-1">
            <CardContent className="p-4">
              <DailyProgressRing />
            </CardContent>
          </Card>
        </SectionReveal>
      </div>
    </div>
  );
}
