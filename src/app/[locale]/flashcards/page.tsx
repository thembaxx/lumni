import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { FlashcardsClient } from "./flashcards-client";

export const metadata: Metadata = {
  title: "Flashcards - Lumni",
  description: "Study with spaced repetition flashcards",
};


export default function FlashcardsPage() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
        <FlashcardsClient />
      </Suspense>
    </AppErrorBoundary>
  );
}
