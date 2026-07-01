import type { Metadata } from "next";
import { Suspense } from "react";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsClient } from "./settings-client";

export const metadata: Metadata = {
  title: "Settings - Lumni",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="subtle" />
        <NoiseOverlay opacity={0.015} />
        <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
          <SettingsClient />
        </Suspense>
      </div>
    </AppErrorBoundary>
  );
}

export const instant = false;
