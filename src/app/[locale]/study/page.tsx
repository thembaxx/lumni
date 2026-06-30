import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StudyBrowserClient } from "./study-browser-client";

export const metadata: Metadata = {
  title: "Browse Lessons - Lumni",
  description: "Browse and study lessons across all subjects",
};

export default function StudyPage() {
  return (
    <AppErrorBoundary>
      <StudyBrowserClient />
    </AppErrorBoundary>
  );
}

export const instant = false;
