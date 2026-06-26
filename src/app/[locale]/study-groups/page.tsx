import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { StudyGroupsList } from "./study-groups-list";

export const metadata: Metadata = {
  title: "Study Groups - Lumni",
  description: "Collaborate and study together with your peers",
};

export const instant = false;

export default function StudyGroupsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudyGroupsList />
    </Suspense>
  );
}
