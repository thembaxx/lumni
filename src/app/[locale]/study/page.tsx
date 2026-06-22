import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { StudyBrowserClient } from "./study-browser-client";

export const metadata: Metadata = {
  title: "Browse Lessons - Lumni",
  description: "Browse and study lessons across all subjects",
};

export default function StudyPage() {
  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-8">
            <Skeleton className="h-8 w-48 rounded-2xl" />
            <Skeleton className="h-4 w-64 rounded-2xl" />
            <div className="mt-4 flex flex-col gap-3">
              {[...Array(6)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                <Skeleton key={`sk-${i}`} className="h-16 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <StudyBrowserClient />
      </Suspense>
    </AppErrorBoundary>
  );
}
