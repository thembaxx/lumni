import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { Skeleton } from "@/components/ui/skeleton";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { FlashcardsClient } from "./flashcards-client";

export const metadata: Metadata = {
  title: "Flashcards - Lumni",
  description: "Spaced repetition flashcards for active recall",
};

export default function FlashcardsPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="study" />
        <NoiseOverlay opacity={0.015} />
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center gap-4 p-8">
              <Skeleton className="h-10 w-48 rounded-2xl" />
              <Skeleton className="h-64 w-full max-w-md rounded-2xl" />
              <Skeleton className="h-12 w-full max-w-md rounded-2xl" />
            </div>
          }
        >
          <FlashcardsClient />
        </Suspense>
      </div>
    </AppErrorBoundary>
  );
}
