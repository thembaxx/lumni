"use client";

import { AssessmentHeader } from "@/components/ui/headers/assessment-header";

interface QuizHeaderProps {
  elapsedTime: number;
  currentIndex: number;
  totalQuestions: number;
  correctAnswers: number;
  onQuit: () => void;
}

export function QuizHeader({
  elapsedTime,
  currentIndex,
  totalQuestions,
  correctAnswers,
  onQuit,
}: QuizHeaderProps) {
  return (
    <AssessmentHeader
      title="Quiz Practice"
      elapsedTime={elapsedTime}
      currentQuestionIndex={currentIndex}
      totalQuestions={totalQuestions}
      progressValue={((currentIndex + 1) / totalQuestions) * 100}
      showAccuracy
      accuracy={
        totalQuestions > 0 ? Math.round((correctAnswers / (currentIndex + 1 || 1)) * 100) : 0
      }
      onQuit={onQuit}
    />
  );
}
