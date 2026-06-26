import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ProgressPageClient } from "./progress-page-client";

export const metadata: Metadata = {
  title: "Progress - Lumni",
  description: "Track your learning progress",
};

export const instant = false;

export default function ProgressPage() {
  return (
    <AppErrorBoundary>
      <ProgressPageClient />
    </AppErrorBoundary>
  );
}
