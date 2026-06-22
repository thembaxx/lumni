import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageSkeleton } from "@/components/ui/skeletons";

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

async function DashboardContent() {
  return <DashboardClient initialTab="today" />;
}
