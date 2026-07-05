import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { ExamSessionWithResume } from "./exam-session-client";

export const metadata: Metadata = {
  title: "Exam Session - Lumni",
};

export default async function ExamPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const [{ id }, { mode }] = await Promise.all([params, searchParams]);

  return (
    <AppErrorBoundary>
      <ExamSessionWithResume
        id={id}
        mode={mode === "timed" ? "timed" : mode === "mock" ? "mock" : "practice"}
      />
    </AppErrorBoundary>
  );
}
