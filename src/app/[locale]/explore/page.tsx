import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ExplorePageClient } from "./explore-page-client";

export const metadata: Metadata = {
  title: "Explore - Lumni",
};

export default function ExplorePage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="dashboard" />
      <PageContainer className="flex flex-col gap-8 pb-24 pt-6 sm:pb-28 lg:pb-32">
        <Suspense fallback={<PageSkeleton />}>
          <ExplorePageClient />
        </Suspense>
      </PageContainer>
    </div>
  );
}
