import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { StudyPlanner } from "@/components/study-planner/study-planner";

export const metadata: Metadata = {
  title: "Study Plan - Lumni",
};

export default async function StudyPlanPage() {
  "use cache";
  return (
    <div className="min-h-dvh bg-system-grouped pt-4 pb-24">
      <PageContainer>
        <Suspense fallback={<PageSkeleton />}>
          <StudyPlanContent />
        </Suspense>
      </PageContainer>
    </div>
  );
}

async function StudyPlanContent() {
  return <StudyPlanner />;
}
