import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { ProblemsClient } from "./problems-client";

export const metadata: Metadata = {
  title: "Problem Library - Lumni",
  description: "Browse curated practice problems with step-by-step solutions",
};

export default async function ProblemsPage() {
  "use cache";
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ProblemsContent />
    </Suspense>
  );
}

async function ProblemsContent() {
  return <ProblemsClient />;
}
