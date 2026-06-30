import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/skeletons";
import { AnalyticsClient } from "./analytics-client";

export const instant = false;

export default function AdminAnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}

async function AnalyticsContent() {
  return <AnalyticsClient />;
}
