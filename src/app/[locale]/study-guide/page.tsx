import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import StudyGuidePage from "./study-guide-content";

export default function StudyGuidePageWrapper() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="study" />
      <NoiseOverlay opacity={0.015} />
      <Suspense fallback={<PageSkeleton />}>
        <StudyGuidePage />
      </Suspense>
    </div>
  );
}

export const instant = false;
