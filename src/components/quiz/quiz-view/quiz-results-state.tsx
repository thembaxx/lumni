"use client";

import { QuizResultsCard } from "@/components/quiz";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { Reveal, SpotlightCard } from "@/components/shared/motion-primitives";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizResultsStateProps {
  totalQuestions: number;
  correctAnswers: number;
  elapsedTime: number;
  subject: string;
  sources?: { url: string; title: string }[];
  questions?: Question[];
  correctness?: boolean[];
  userAnswers?: UserAnswer[];
  onRestart: () => void;
  onDashboard: () => void;
  onPracticeMistakes?: () => void;
}

export function QuizResultsState({
  totalQuestions,
  correctAnswers,
  elapsedTime,
  subject,
  sources,
  questions,
  correctness,
  userAnswers,
  onRestart,
  onDashboard,
  onPracticeMistakes,
}: QuizResultsStateProps) {
  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
      <div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
        <Reveal y={20} className="w-full max-w-md">
          <SpotlightCard className="rounded-card-lg" radius={360}>
            <QuizResultsCard
              totalQuestions={totalQuestions}
              correctAnswers={correctAnswers}
              elapsedTime={elapsedTime}
              subject={subject ?? "Quiz"}
              sources={sources}
              questions={questions}
              correctness={correctness}
              userAnswers={userAnswers}
              onRestart={onRestart}
              onDashboard={onDashboard}
              onPracticeMistakes={onPracticeMistakes}
            />
          </SpotlightCard>
        </Reveal>
      </div>
      <DecorativeRightPanel />
    </div>
  );
}
