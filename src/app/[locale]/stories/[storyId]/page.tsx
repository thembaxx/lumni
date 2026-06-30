import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { StoryReaderClient } from "./story-reader-client";

export const metadata: Metadata = {
  title: "Story - Lumni",
  description: "Read and practice comprehension",
};

export default function StoryPage() {
  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-8">
            <Skeleton className="h-8 w-64 rounded-2xl" />
            <Skeleton className="h-4 w-40 rounded-2xl" />
            <Skeleton className="mt-4 h-96 w-full rounded-3xl" />
          </div>
        }
      >
        <StoryReaderClient />
      </Suspense>
    </AppErrorBoundary>
  );
}

export const instant = false;
