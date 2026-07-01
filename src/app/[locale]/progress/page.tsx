import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ProgressPageClient } from "./progress-page-client";

export const metadata: Metadata = {
  title: "Progress - Lumni",
  description: "Track your learning progress",
};

export default function ProgressPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="dashboard" />
        <NoiseOverlay opacity={0.015} />
        <ProgressPageClient />
      </div>
    </AppErrorBoundary>
  );
}

export const instant = false;
