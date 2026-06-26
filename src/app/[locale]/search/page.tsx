import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SearchPageClient } from "./search-page-client";

export const metadata = {
  title: "Search",
  description: "Search across all your study materials",
};

export default async function SearchPage() {
  "use cache";
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}

async function SearchContent() {
  return <SearchPageClient />;
}
