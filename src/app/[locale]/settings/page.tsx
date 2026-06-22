import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsClient } from "./settings-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings - Lumni",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<Skeleton className="h-96 rounded-2xl" />}>
        <SettingsClient />
      </Suspense>
    </AppErrorBoundary>
  );
}
