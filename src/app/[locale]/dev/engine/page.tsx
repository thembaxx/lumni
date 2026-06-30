import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import DevEnginePage from "./dev-engine-content";

export default function DevEnginePageWrapper() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DevEnginePage />
    </Suspense>
  );
}

export const instant = false;
