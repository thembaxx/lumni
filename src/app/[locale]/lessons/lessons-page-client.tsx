"use client";

import { PageContainer } from "@/components/layout/page-container";
import { LessonLibrary } from "@/components/lesson/lesson-library";

export function LessonsPageClient() {
  return (
    <PageContainer>
      <div className="py-6">
        <h1 className="ios-title-1 mb-6 font-extrabold text-foreground tracking-tight">Lessons</h1>
        <LessonLibrary />
      </div>
    </PageContainer>
  );
}
