"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import MailSend01Icon from "@hugeicons/core-free-icons/MailSend01Icon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TTSButton } from "@/components/shared/tts-button";
import { Button } from "@/components/ui/button";
import type { useSolver } from "@/hooks/use-solver";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import {
  SourceAttributionPill,
  type SourceAttributionPillSource,
} from "../source-attribution-pill";
import { CoachingPanel } from "../coaching-panel";
import { StepByStep } from "../step-by-step";

type Solver = ReturnType<typeof useSolver>;

interface QuestionCardFeedbackOptions {
  isCorrect?: boolean | null;
  showExplanation?: boolean;
  isGrading?: boolean;
  isSolverEnabled?: boolean;
}

interface QuestionCardFeedbackProps {
  state: {
    isSubmitted: boolean;
    isCorrect: boolean | null;
    showHint: boolean;
    showExplanation: boolean;
  };
  gradeResult: {
    correct: boolean;
    score: number;
    feedback: string;
  } | null;
  question: {
    id: string;
    questionText: string;
    explanation: string | undefined;
    steps?: string[];
    points: number;
    type: string;
    subject: string;
    hint?: string;
    webSources?: SourceAttributionPillSource[];
  };
  effectiveSubject: string;
  options: QuestionCardFeedbackOptions;
  solver: Solver;
  followUpMsgs: {
    role: "user" | "assistant";
    content: string;
  }[];
  handleFollowUp: () => void;
  followUpInput: string;
  setFollowUpInput: React.Dispatch<React.SetStateAction<string>>;
}

const DEFAULT_FEEDBACK_OPTIONS: QuestionCardFeedbackOptions = {};

function AskInChatButton({ questionText }: { questionText: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => router.push(`/chat?q=${encodeURIComponent(questionText)}`)}
      className="h-9 gap-2 self-start text-sm"
    >
      <HugeiconsIcon icon={Chat01Icon} data-icon="inline-start" />
      Ask in Chat
    </Button>
  );
}

export function QuestionCardFeedback({
  state,
  gradeResult,
  question,
  effectiveSubject,
  options: {
    isCorrect: _isCorrect,
    showExplanation: _showExplanation,
    isGrading: _isGrading,
    isSolverEnabled,
  } = DEFAULT_FEEDBACK_OPTIONS,
  solver,
  followUpMsgs,
  handleFollowUp,
  followUpInput,
  setFollowUpInput,
}: QuestionCardFeedbackProps) {
  const t = useTranslations();
  if (!state.showExplanation) {
    return null;
  }

  const feedback = gradeResult;
  const isCorrectAnswer = feedback?.correct ?? false;

  return (
    <m.div
      role="alert"
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, ease: iOSEase }}
      className={cn(
        "flex flex-col gap-3 rounded-lg p-4",
        isCorrectAnswer ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      <div className="flex items-center gap-3">
        <m.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {isCorrectAnswer ? (
            <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-10 shrink-0" />
          ) : (
            <HugeiconsIcon icon={Cancel01Icon} className="size-10 shrink-0" />
          )}
        </m.div>
        <p className="font-medium">
          {isCorrectAnswer ? t("quiz.correctLabel") : t("quiz.incorrectLabel")}
        </p>
      </div>
      {feedback && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {t("quiz.scoreFraction", {
                score: feedback.score,
                points: question.points,
              })}
            </span>
          </div>
          <div className="text-sm opacity-90">
            <MarkdownRenderer
              content={(feedback.feedback || question.explanation) ?? ""}
              subject={effectiveSubject}
            />
          </div>
        </div>
      )}
      {question.webSources && question.webSources.length > 0 && (
        <SourceAttributionPill sources={question.webSources} />
      )}
      {feedback?.feedback && (
        <div className="flex justify-end">
          <TTSButton text={feedback.feedback} />
        </div>
      )}
      <AskInChatButton questionText={question.questionText} />
      {feedback && (
        <CoachingPanel
          questionId={question.id}
          questionType={question.type}
          initialDraft=""
          initialResult={feedback}
        />
      )}
      {question.steps && question.steps.length > 0 && (
        <div className="border-current/20 border-t pt-2">
          <StepByStep
            steps={question.steps}
            subject={effectiveSubject}
            className="text-foreground"
          />
        </div>
      )}
      {!isCorrectAnswer && isSolverEnabled && (
        <div className="flex flex-col gap-2 border-current/20 border-t pt-2">
          {solver.isPending ? (
            <div className="flex items-center justify-center gap-2 py-3">
              <HugeiconsIcon icon={RadialIcon} className="size-5 animate-spin" aria-hidden="true" />
              <span className="text-sm">{t("quiz.solving")}</span>
            </div>
          ) : solver.data?.steps?.length ? (
            <div className="flex flex-col gap-2">
              <p className="font-bold text-foreground/60 text-xs uppercase tracking-wider">
                {t("quiz.stepByStepSolution")}
              </p>
              <StepByStep
                steps={solver.data.steps}
                subject={effectiveSubject}
                className="text-foreground"
              />
            </div>
          ) : solver.data?.solution ? (
            <div className="overflow-wrap-anywhere whitespace-pre-wrap rounded-xl border border-border/50 bg-card p-4 text-sm leading-relaxed">
              {solver.data.solution}
            </div>
          ) : solver.isError ? (
            <div className="flex items-center gap-2 py-2">
              <span className="text-sm opacity-80">{t("quiz.couldNotGenerateSteps")}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  solver.mutate({
                    question: question.questionText,
                    subject: effectiveSubject,
                  })
                }
                className="h-8 text-xs"
              >
                {t("common.retry")}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                solver.mutate({
                  question: question.questionText,
                  subject: effectiveSubject,
                })
              }
              className="h-9 gap-2 self-start text-sm"
            >
              <HugeiconsIcon icon={SparklesIcon} data-icon="inline-start" />
              {t("quiz.showSteps")}
            </Button>
          )}
        </div>
      )}
      {solver.data && (
        <div className="flex flex-col gap-2 border-current/20 border-t pt-2">
          {followUpMsgs.map((msg) => (
            <div
              key={`followup-${msg.content}`}
              className={cn(
                "overflow-wrap-anywhere max-w-[calc(100%-var(--space-8))] rounded-xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "ml-auto bg-(--system-accent-alpha-10)"
                  : "mr-auto border border-border/50 bg-card",
              )}
            >
              {msg.content}
            </div>
          ))}
          {solver.isSendingFollowUp && (
            <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
              <HugeiconsIcon icon={RadialIcon} className="size-4 animate-spin" aria-hidden="true" />
              {t("quiz.thinking")}
            </div>
          )}
          {solver.followUpError && (
            <div className="flex items-center gap-2 py-2">
              <span className="text-sm opacity-80">{t("quiz.couldNotGetAnswer")}</span>
              <Button variant="ghost" size="sm" onClick={handleFollowUp} className="h-8 text-xs">
                {t("common.retry")}
              </Button>
            </div>
          )}
          {!solver.isSendingFollowUp && (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={followUpInput}
                onChange={(e) => setFollowUpInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleFollowUp();
                  }
                }}
                aria-label="Follow-up question input"
                placeholder={t("quiz.followUpPlaceholder")}
                className="h-9 flex-1 rounded-lg border border-border bg-card px-3 text-base outline-none focus:border-(--system-accent-alpha-40)"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleFollowUp}
                disabled={!followUpInput.trim()}
                aria-label={t("quiz.sendFollowUp")}
                className="size-9 shrink-0"
              >
                <HugeiconsIcon icon={MailSend01Icon} data-icon aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      )}
    </m.div>
  );
}
