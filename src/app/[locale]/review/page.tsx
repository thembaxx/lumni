import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ReviewClient } from "./review-client";

export const metadata: Metadata = {
  title: "Wrong Answer Journal - Lumni",
  description: "Review and learn from your past mistakes",
};

export default async function ReviewPage() {
  "use cache";
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ReviewContent />
    </Suspense>
  );
}

async function ReviewContent() {
  return <ReviewClient />;
}
