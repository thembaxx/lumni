import type { Metadata } from "next";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { LessonViewClient } from "./lesson-view-client";

export const metadata: Metadata = {
  title: "Lesson - Lumni",
  description: "Study lesson content",
};

export default function LessonPage({
  params,
}: {
  params: { subjectId: string; topicId: string; subtopicId: string };
}) {
  const { subjectId, topicId, subtopicId } = params;
  return (
    <AppErrorBoundary>
      <LessonViewClient subjectId={subjectId} topicId={topicId} subtopicId={subtopicId} />
    </AppErrorBoundary>
  );
}

export const instant = false;
