import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ScientificCalculator } from "@/components/tools/math/scientific-calculator";

export const metadata: Metadata = {
  title: "Scientific Calculator - Lumni",
};

export default function CalculatorPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pt-4 pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer>
        <Suspense fallback={<PageSkeleton />}>
          <ScientificCalculator />
        </Suspense>
      </PageContainer>
    </div>
  );
}

export const instant = false;
