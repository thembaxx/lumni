import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StudyBrowserClient } from "./study-browser-client";

export const metadata: Metadata = {
  title: "Study - Lumni",
  description: "Browse study materials",
};

export default function StudyPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="study" />
        <NoiseOverlay opacity={0.015} />
        <StudyBrowserClient />
      </div>
    </AppErrorBoundary>
  );
}

export const instant = false;
