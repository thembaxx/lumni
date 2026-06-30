import type { Metadata } from "next";
import { Suspense } from "react";
import { QuestionCardSkeleton } from "@/components/quiz/parts/QuestionCardSkeleton";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { QuestionBankClient } from "./question-bank-client";

export const metadata: Metadata = {
  title: "Past Exam Questions - Lumni",
  description: "Browse and practice past exam questions by subject and topic",
};

export default function QuestionsPage() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<QuestionCardSkeleton />}>
        <QuestionBankClient />
      </Suspense>
    </AppErrorBoundary>
  );
}

export const instant = false;
