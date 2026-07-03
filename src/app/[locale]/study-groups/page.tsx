import type { Metadata } from "next";
import { Suspense } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { GroupsHub } from "@/components/study-groups/groups-hub";

export const metadata: Metadata = {
  title: "Study Groups - Lumni",
  description: "Collaborate and study together with your peers",
};

export default function StudyGroupsPage() {
  return (
    <PageContainer>
      <Suspense fallback={null}>
        <GroupsHub />
      </Suspense>
    </PageContainer>
  );
}

export const instant = false;
