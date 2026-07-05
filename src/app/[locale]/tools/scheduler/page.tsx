import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SmartScheduler } from "@/components/tools/scheduling/smart-scheduler";

export const metadata: Metadata = {
  title: "Study Scheduler - Lumni",
};

export default function SchedulerPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer>
        <Suspense fallback={<PageSkeleton />}>
          <SmartScheduler />
        </Suspense>
      </PageContainer>
    </div>
  );
}
