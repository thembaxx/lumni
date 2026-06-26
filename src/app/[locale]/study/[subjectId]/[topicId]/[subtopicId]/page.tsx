import type { Metadata } from "next";
import { Suspense } from "react";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { LessonViewClient } from "./lesson-view-client";

export const metadata: Metadata = {
  title: "Lesson - Lumni",
  description: "Study lesson content",
};

export default async function LessonPage({
  params,
}: {
  params: Promise<{ subjectId: string; topicId: string; subtopicId: string }>;
}) {
  "use cache";
  const { subjectId, topicId, subtopicId } = await params;
  return (
    <AppErrorBoundary>
      <Suspense
        fallback={
          <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-8">
            <Skeleton className="h-8 w-64 rounded-2xl" />
            <Skeleton className="h-4 w-40 rounded-2xl" />
            <div className="mt-4 flex flex-col gap-3">
              {[...Array(4)].map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
                <Skeleton key={i} className="h-32 w-full rounded-3xl" />
              ))}
            </div>
          </div>
        }
      >
        <LessonViewClient subjectId={subjectId} topicId={topicId} subtopicId={subtopicId} />
      </Suspense>
    </AppErrorBoundary>
  );
}
