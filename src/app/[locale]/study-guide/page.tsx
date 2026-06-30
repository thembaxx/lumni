import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import StudyGuidePage from "./study-guide-content";

export default function StudyGuidePageWrapper() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <StudyGuidePage />
    </Suspense>
  );
}
