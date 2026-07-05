import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { StudySetCreator } from "@/components/tools/study-sets/study-set-creator";

export const metadata: Metadata = {
  title: "Study Sets - Lumni",
};

export default function StudySetsPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer>
        <Suspense fallback={<PageSkeleton />}>
          <StudySetCreator />
        </Suspense>
      </PageContainer>
    </div>
  );
}
