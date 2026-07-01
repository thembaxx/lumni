import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SearchPageClient } from "./search-page-client";

export const metadata = {
  title: "Search",
  description: "Search across all your study materials",
};

export default function SearchPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="subtle" />
      <NoiseOverlay opacity={0.015} />
      <Suspense fallback={<PageSkeleton />}>
        <SearchPageClient />
      </Suspense>
    </div>
  );
}

export const instant = false;
