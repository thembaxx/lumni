import { HydrationBoundary, dehydrate, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { PageSkeleton } from "@/components/ui/skeletons";

export default async function DashboardPage() {
  const queryClient = new QueryClient();

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await queryClient.prefetchQuery({
      queryKey: ["subjects"],
      queryFn: async () => {
        const res = await fetch(`${baseUrl}/api/subjects`, { cache: "no-store" });
        if (!res.ok) return { subjects: [], selectedSubjectIds: [] };
        return res.json() as Promise<{ subjects: unknown[]; selectedSubjectIds: string[] }>;
      },
    });
  } catch {
    // Prefetch is non-critical — placeholderData handles the fallback
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<PageSkeleton />}>
        <DashboardClient initialTab="today" />
      </Suspense>
    </HydrationBoundary>
  );
}

export const instant = false;
