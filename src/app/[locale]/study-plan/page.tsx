import type { Metadata } from "next";
import { PageContainer } from "@/components/layout/page-container";
import { FlagBar } from "@/components/ui/flag-bar";
import { StudyPlanner } from "@/components/study-planner/study-planner";

export const metadata: Metadata = {
  title: "Study Plan - Lumni",
};

export default function StudyPlanPage() {
  return (
    <div className="min-h-dvh bg-(--bg) text-(--fg)">
      <FlagBar height={8} />
      <PageContainer className="py-8">
        <StudyPlanner />
      </PageContainer>
    </div>
  );
}
