import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { SharedQuestionClient } from "./shared-question-client";

export const instant = false;

export const metadata: Metadata = {
  title: "Shared Question | Lumni",
  description: "View and rate a shared question from Lumni",
};

export default function SharedQuestionPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <SharedQuestionClient />
    </Suspense>
  );
}
