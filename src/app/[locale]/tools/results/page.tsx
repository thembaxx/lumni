import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ResultsSearch } from "@/components/tools/communication/results-search";

export const metadata: Metadata = {
  title: "Results Search - Lumni",
};

export default function ResultsPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer>
        <Suspense fallback={<PageSkeleton />}>
          <ResultsSearch />
        </Suspense>
      </PageContainer>
    </div>
  );
}
