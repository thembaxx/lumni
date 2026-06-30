import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ToolsPageClient } from "./tools-page-client";

export const metadata: Metadata = {
  title: "Tools - Lumni",
  description: "Learning tools and utilities",
};

export default function ToolsPage() {
  return (
    <AppErrorBoundary>
      <ToolsPageClient />
    </AppErrorBoundary>
  );
}

export const instant = false;
