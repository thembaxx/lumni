import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ReviewClient } from "./review-client";

export const metadata: Metadata = {
  title: "Wrong Answer Journal - Lumni",
  description: "Review and learn from your past mistakes",
};

export default function ReviewPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="study" />
      <NoiseOverlay opacity={0.015} />
      <Suspense fallback={<PageSkeleton />}>
        <ReviewClient />
      </Suspense>
    </div>
  );
}

export const instant = false;
