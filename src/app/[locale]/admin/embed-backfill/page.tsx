import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import EmbedBackfillPage from "./embed-backfill-content";

export const instant = false;

export default function EmbedBackfillPageWrapper() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <EmbedBackfillPage />
    </Suspense>
  );
}
