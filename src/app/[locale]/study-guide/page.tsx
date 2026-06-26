import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import StudyGuidePage from "./study-guide-content";

export const instant = false;

export default function StudyGuidePageWrapper() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudyGuidePage />
    </Suspense>
  );
}
