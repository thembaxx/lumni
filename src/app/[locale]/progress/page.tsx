import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NavigationBar } from "@/components/ui/navigation-bar";
import { PageContainer } from "@/components/layout/page-container";
import { PageSkeleton } from "@/components/ui/skeletons";
import { ProgressPageClient } from "./progress-page-client";

export const metadata: Metadata = {
  title: "Progress - Lumni",
};

export default function ProgressPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="dashboard" />
      <NavigationBar title="Progress" />
      <PageContainer className="flex flex-col gap-8 pb-24 sm:pb-28 lg:pb-32">
        <Suspense fallback={<PageSkeleton />}>
          <ProgressPageClient />
        </Suspense>
      </PageContainer>
    </div>
  );
}
