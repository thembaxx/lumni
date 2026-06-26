import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import DevVisualPage from "./dev-visual-content";

export const instant = false;

export default function DevVisualPageWrapper() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DevVisualPage />
    </Suspense>
  );
}
