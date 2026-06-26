import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { StoriesClient } from "./stories-client";

export const metadata: Metadata = {
  title: "Stories - Lumni",
  description: "Read stories and practice comprehension",
};

export default async function StoriesPage() {
  "use cache";
  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 pt-8">
            <Skeleton className="h-10 w-48 rounded-2xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                <Skeleton key={i} className="h-48 rounded-3xl" />
              ))}
            </div>
          </div>
        }
      >
        <StoriesClient />
      </Suspense>
    </AppErrorBoundary>
  );
}
