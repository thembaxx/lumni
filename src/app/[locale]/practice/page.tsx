import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { PracticePageClient } from "./practice-page-client";

export const metadata: Metadata = {
  title: "Practice - Lumni",
  description: "Practice with exams and past papers",
};

export const instant = false;

export default function PracticePage() {
  return (
    <AppErrorBoundary>
      <PracticePageClient />
    </AppErrorBoundary>
  );
}
