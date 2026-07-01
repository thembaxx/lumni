import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { DictionaryClient } from "./dictionary-client";

export const metadata: Metadata = {
  title: "Dictionary - Lumni",
  description: "Look up word definitions, pronunciation, and save vocabulary",
};

export default function DictionaryPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="default" />
        <NoiseOverlay opacity={0.015} />
        <Suspense
          fallback={
            <div className="flex flex-col gap-4 p-6">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          }
        >
          <DictionaryClient />
        </Suspense>
      </div>
    </AppErrorBoundary>
  );
}

export const instant = false;
