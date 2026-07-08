import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { SpotlightCard } from "@/components/shared/motion-primitives";
import { StudyPlanner } from "@/components/study-planner/study-planner";

export const metadata: Metadata = {
  title: "Study Plan - Lumni",
};

export default function StudyPlanPage() {
  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient variant="study" />
      <PageContainer>
        <SpotlightCard className="rounded-card-lg" radius={440}>
          <StudyPlanner />
        </SpotlightCard>
      </PageContainer>
    </div>
  );
}
