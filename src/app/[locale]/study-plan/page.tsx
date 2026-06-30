import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { StudyPlanner } from "@/components/study-planner/study-planner";

export const metadata: Metadata = {
  title: "Study Plan - Lumni",
};

export default function StudyPlanPage() {
  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <PageContainer>
        <StudyPlanner />
      </PageContainer>
    </div>
  );
}

export const instant = false;
