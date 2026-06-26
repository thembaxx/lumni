import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { LearnPageClient } from "./learn-page-client";

export const metadata: Metadata = {
  title: "Learn - Lumni",
  description: "Explore learning resources",
};

export const instant = false;

export default function LearnPage() {
  return (
    <AppErrorBoundary>
      <LearnPageClient />
    </AppErrorBoundary>
  );
}
