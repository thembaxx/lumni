"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon";
import Refresh01Icon from "@hugeicons/core-free-icons/Refresh01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Confetti } from "@/components/celebration";
import { NextActions } from "@/components/quiz/next-actions";
import { QuestionReviewPanel } from "@/components/quiz/question-review-panel";
import { ShareResultButton } from "@/components/shared/share-button";
import { VerifiedByPill } from "@/components/tools/communication/verified-by-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { calculateAccuracy, formatTime } from "@/lib/shared/time";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/shared/fade-in";

const CONTAINER_VARIANTS = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 26,
      bounce: 0,
    },
  },
};

interface QuizResultsCardProps {
  totalQuestions: number;
  correctAnswers: number;
  elapsedTime: number;
  subject: string;
  sources?: { url: string; title: string }[];
  questions?: Question[];
  correctness?: boolean[];
  userAnswers?: UserAnswer[];
  onRestart?: () => void;
  onDashboard?: () => void;
  onPracticeMistakes?: () => void;
  className?: string;
}

export function QuizResultsCard({
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
  className,
}: QuizResultsCardProps) {
  const t = useTranslations();
  const [showReview, setShowReview] = useState(false);
  const accuracy = calculateAccuracy(correctAnswers, totalQuestions);
  const isGreatScore = accuracy >= 80;
  const isPerfect = accuracy === 100;

  const containerVariants = CONTAINER_VARIANTS;
  const itemVariants = ITEM_VARIANTS;

  return (
    <FadeIn direction="scale" scaleDistance={0.95} duration={0.3} className="relative">
      <Confetti trigger={isGreatScore} count={60} duration={2500} />
      {isPerfect && (
        <m.div
          className="absolute -top-4 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
        >
          <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2 shadow-level-2">
            <HugeiconsIcon icon={Award01Icon} className="size-5" />
            <span className="font-extrabold">{t("quiz.perfectScore")}</span>
          </Badge>
        </m.div>
      )}

      <Card className={cn("relative", className)}>
        <m.div
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-card-lg"
          initial={{ opacity: 0 }}
          animate={isGreatScore ? { opacity: [0, 0.3, 0] } : { opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="absolute inset-0 bg-success/10" />
        </m.div>

        <CardHeader className="flex flex-col gap-2 p-6 pb-0 md:text-left">
          <FadeIn direction="down" distance={10} delay={0.1}>
            <CardTitle className="font-extrabold text-xl tracking-tight">
              {isPerfect
                ? t("quiz.flawless")
                : isGreatScore
                  ? t("quiz.greatJob")
                  : t("quiz.quizComplete")}
            </CardTitle>
          </FadeIn>
          <p className="text-muted-foreground text-sm">{t("quiz.hereAreResults")}</p>
        </CardHeader>

        <CardContent>
          <m.div
            className="flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <section className="flex flex-col gap-4">
              <m.div className="grid grid-cols-12 gap-4 md:text-left" variants={itemVariants}>
                <FadeIn distance={0} delay={0.3} className="col-span-4 rounded-lg bg-muted p-4">
                  <FadeIn
                    distance={0}
                    delay={0.3}
                    className="font-extrabold text-2xl tabular-nums"
                    as="span"
                  >
                    {totalQuestions}
                  </FadeIn>
                  <p className="text-muted-foreground text-xs">{t("quiz.questions")}</p>
                </FadeIn>
                <FadeIn distance={0} delay={0.4} className="col-span-2 rounded-lg bg-muted p-4">
                  <p
                    className={cn(
                      "font-extrabold text-2xl tabular-nums",
                      isGreatScore && "text-success",
                    )}
                  >
                    {correctAnswers}
                  </p>
                  <p className="text-muted-foreground text-xs">{t("quiz.correct")}</p>
                </FadeIn>
                <FadeIn distance={0} delay={0.5} className="col-span-3 rounded-lg bg-muted p-4">
                  <p
                    className={cn(
                      "font-extrabold text-2xl tabular-nums",
                      isGreatScore && "text-success",
                    )}
                  >
                    {accuracy}%
                  </p>
                  <p className="text-muted-foreground text-xs">{t("quiz.accuracy")}</p>
                </FadeIn>
                {(() => {
                  const aps = getAPSForSubject(accuracy);
                  return (
                    <FadeIn distance={0} delay={0.6} className="col-span-3 rounded-lg bg-muted p-4">
                      <p
                        className={cn(
                          "font-extrabold text-2xl tabular-nums",
                          aps >= 6 && "text-success",
                          aps >= 4 && aps < 6 && "text-warning",
                          aps < 4 && "text-destructive",
                        )}
                      >
                        {aps}/7
                      </p>
                      <p className="text-muted-foreground text-xs">{getGrade(accuracy)}</p>
                    </FadeIn>
                  );
                })()}
              </m.div>

              <m.div className="grid grid-cols-12 gap-4" variants={itemVariants}>
                <FadeIn distance={0} delay={0.7} className="col-span-12 rounded-lg bg-muted p-4">
                  <p className="font-extrabold text-2xl tabular-nums">{formatTime(elapsedTime)}</p>
                  <p className="text-muted-foreground text-xs">{t("quiz.time")}</p>
                </FadeIn>
              </m.div>
            </section>

            <VerifiedByPill sources={sources ?? []} />

            {questions && questions.length > 0 && (
              <m.div variants={itemVariants}>
                <NextActions
                  subject={subject}
                  correctness={correctness ?? []}
                  totalQuestions={totalQuestions}
                />
              </m.div>
            )}

            {questions && questions.length > 0 && (
              <m.div variants={itemVariants} className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowReview(!showReview)}
                  className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-left font-medium text-sm transition-colors hover:bg-muted"
                  aria-expanded={showReview}
                  aria-controls="question-review-panel"
                >
                  <span>Review Answers</span>
                  <span className="text-muted-foreground text-xs">
                    {showReview ? "Hide" : `Show ${questions.length} questions`}
                  </span>
                </button>
                {showReview && (
                  <QuestionReviewPanel
                    questions={questions}
                    correctness={correctness ?? []}
                    userAnswers={userAnswers}
                    subject={subject}
                    onPracticeMistakes={onPracticeMistakes}
                    correctAnswers={correctAnswers}
                    totalQuestions={totalQuestions}
                  />
                )}
              </m.div>
            )}

            {(onRestart || onDashboard) && (
              <m.div className="flex flex-col gap-3 pt-2" variants={itemVariants}>
                <div className="flex gap-3">
                  {onRestart && (
                    <Button variant="default" onClick={onRestart} className="flex-1 gap-2">
                      <HugeiconsIcon icon={Refresh01Icon} className="size-4" />
                      {t("common.retry")}
                    </Button>
                  )}
                  {onDashboard && (
                    <Button variant="outline" onClick={onDashboard} className="flex-1 gap-2">
                      <HugeiconsIcon icon={DashboardSquare01Icon} className="size-4" />
                      {t("quiz.dashboard")}
                    </Button>
                  )}
                </div>
                <ShareResultButton
                  cardParams={{
                    score: correctAnswers,
                    total: totalQuestions,
                    percentage: accuracy,
                    title: `${subject} Quiz`,
                    subtitle: `${getAPSForSubject(accuracy)}/7 APS · ${getGrade(accuracy)}`,
                    type: "quiz",
                  }}
                  text={t("quiz.shareText", { accuracy, subject })}
                />
              </m.div>
            )}
          </m.div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
