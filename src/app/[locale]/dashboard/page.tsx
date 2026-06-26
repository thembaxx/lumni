import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageSkeleton } from "@/components/ui/skeletons";

export const instant = false;

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardClient initialTab="today" />
    </Suspense>
  );
}
