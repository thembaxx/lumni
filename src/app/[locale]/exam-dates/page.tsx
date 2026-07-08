import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { SpotlightCard } from "@/components/shared/motion-primitives";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { NationalExamCalendar } from "@/components/tools/scheduling/national-exam-calendar";

export const metadata: Metadata = {
  title: "Exam Dates - Lumni",
};

export default function ExamDatesPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient variant="default" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer>
        <Suspense fallback={<PageSkeleton />}>
          <SpotlightCard className="rounded-card-lg" radius={440}>
            <NationalExamCalendar />
          </SpotlightCard>
        </Suspense>
      </PageContainer>
    </div>
  );
}
