import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SearchPageClient } from "./search-page-client";

export const metadata = {
  title: "Search",
  description: "Search across all your study materials",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchPageClient />
    </Suspense>
  );
}

export const instant = false;
