import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { PronunciationClient } from "./pronunciation-client";

export const metadata: Metadata = {
  title: "Pronunciation Practice - Lumni",
  description: "Practice your pronunciation with speech recognition",
};

export default function PronunciationPage() {
  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 pt-8">
            <Skeleton className="h-10 w-64 rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-3xl" />
            <Skeleton className="h-12 w-40 rounded-3xl" />
          </div>
        }
      >
        <PronunciationClient />
      </Suspense>
    </AppErrorBoundary>
  );
}
