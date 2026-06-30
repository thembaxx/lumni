import type { Metadata } from "next";
import { Suspense } from "react";
import { QuestionCardSkeleton } from "@/components/quiz/parts/QuestionCardSkeleton";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { QuizClient } from "./quiz-client";

export const metadata: Metadata = {
  title: "Quiz Practice - Lumni",
  description: "Practice your subjects with adaptive quizzes",
};

export default function QuizPage() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<QuestionCardSkeleton />}>
        <QuizClient />
      </Suspense>
    </AppErrorBoundary>
  );
}

export const instant = false;
