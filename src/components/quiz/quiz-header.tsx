"use client";

import { useMotionValue, useMotionValueEvent, useSpring } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { AssessmentHeader } from "@/components/ui/headers/assessment-header";
import { springPresets } from "@/lib/utils/spring-presets";

interface QuizHeaderProps {
  elapsedTime: number;
  currentIndex: number;
  totalQuestions: number;
  correctAnswers: number;
  onQuit: () => void;
}

function SpringAccuracy({ accuracy }: { accuracy: number }) {
  const prevAccuracy = useRef(accuracy);
  const accuracyValue = useMotionValue(accuracy);
  const accuracySpring = useSpring(accuracyValue, springPresets.fast);
  const [display, setDisplay] = useState(accuracy);

  useMotionValueEvent(accuracySpring, "change", (latest) => {
    setDisplay(Math.round(latest));
  });

  useEffect(() => {
    accuracyValue.set(accuracy);
    prevAccuracy.current = accuracy;
  }, [accuracy, accuracyValue]);

  return <>{display}%</>;
}

export function QuizHeader({
  elapsedTime,
  currentIndex,
  totalQuestions,
  correctAnswers,
  onQuit,
}: QuizHeaderProps) {
  const t = useTranslations();
  const accuracy =
    totalQuestions > 0 ? Math.round((correctAnswers / (currentIndex + 1 || 1)) * 100) : 0;

  return (
    <AssessmentHeader
      title={t("quiz.title")}
      elapsedTime={elapsedTime}
      currentQuestionIndex={currentIndex}
      totalQuestions={totalQuestions}
      progressValue={((currentIndex + 1) / totalQuestions) * 100}
      showAccuracy
      accuracyLabel={<SpringAccuracy accuracy={accuracy} />}
      onQuit={onQuit}
    />
  );
}
