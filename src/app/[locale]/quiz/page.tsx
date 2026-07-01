import type { Metadata } from "next";
import { Suspense } from "react";
import { QuestionCardSkeleton } from "@/components/quiz/parts/QuestionCardSkeleton";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { QuizClient } from "./quiz-client";

export const metadata: Metadata = {
  title: "Quiz Practice - Lumni",
  description: "Practice your subjects with adaptive quizzes",
};

export default function QuizPage() {
  return (
    <AppErrorBoundary>
      <div className="relative min-h-dvh bg-system-grouped">
        <AmbientGradient variant="quiz" />
        <NoiseOverlay opacity={0.015} />
        <Suspense fallback={<QuestionCardSkeleton />}>
          <QuizClient />
        </Suspense>
      </div>
    </AppErrorBoundary>
  );
}

export const instant = false;
