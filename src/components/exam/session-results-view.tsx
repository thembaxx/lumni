"use client";

import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { FadeIn } from "@/components/shared/fade-in";
import { Confetti } from "@/components/celebration";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { ShareResultButton } from "@/components/shared/share-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnswerText, getCorrectAnswerText } from "@/lib/exam/helpers";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { cn } from "@/lib/utils";
import type { QuestionPart } from "@/types/exam-paper";

interface SessionResultsViewProps {
  results: {
    partResults: { partId: string; correct: boolean; score: number }[];
  };
  flatParts: { sectionId: string; questionId: string; part: QuestionPart }[];
  answers: Record<string, { value: string | string[] }>;
  metadata: { subject: string; totalMarks: number; duration: string };
  isMock?: boolean;
  onDashboard: () => void;
  onReview?: () => void;
}

export function SessionResultsView({
  results,
  flatParts,
  answers,
  metadata: _metadata,
  isMock,
  onDashboard,
  onReview,
}: SessionResultsViewProps) {
  const t = useTranslations();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const correctCount = results.partResults.filter((r) => r.correct).length;
  const totalCount = results.partResults.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const resultMap = useMemo(
    () => new Map(results.partResults.map((r) => [r.partId, r])),
    [results.partResults],
  );

  const failedCount = totalCount - correctCount;

  return (
    <FadeIn
      direction="up"
      distance={20}
      className="flex min-h-screen flex-col gap-6 bg-background p-4 pb-24"
    >
      <Confetti trigger={accuracy >= 70} count={60} duration={2500} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-extrabold text-xl">
              {accuracy >= 80
                ? t("exam.greatJob")
                : accuracy >= 50
                  ? t("exam.goodEffort")
                  : t("exam.keepPracticing")}
            </CardTitle>
            {isMock && (
              <span className="rounded-full bg-warning/15 px-3 py-1 font-semibold text-warning text-xs">
                {t("exam.mockExam")}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="font-extrabold text-2xl text-success tabular-nums">{correctCount}</p>
              <p className="text-muted-foreground text-xs">{t("exam.correct")}</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="font-extrabold text-2xl text-destructive tabular-nums">{failedCount}</p>
              <p className="text-muted-foreground text-xs">{t("exam.incorrect")}</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="font-extrabold text-2xl tabular-nums">{accuracy}%</p>
              <p className="text-muted-foreground text-xs">{t("exam.accuracy")}</p>
            </div>
            {(() => {
              const aps = getAPSForSubject(accuracy);
              return (
                <div className="rounded-lg bg-muted p-3 text-center">
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
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-2">
        {flatParts.map((item) => {
          const fullId = `${item.sectionId}-${item.questionId}-${item.part.id}`;
          const result = resultMap.get(fullId);
          if (!result) return null;
          const isExpanded = expandedId === fullId;
          return (
            <Card
              key={fullId}
              className={cn(
                "overflow-hidden transition-shadow",
                result.correct ? "border-success/20" : "border-destructive/20",
              )}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : fullId)}
                aria-label={isExpanded ? "Collapse answer details" : "Expand answer details"}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full font-bold text-xs",
                      result.correct
                        ? "bg-success/20 text-success"
                        : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {result.correct ? "\u2713" : "\u2717"}
                  </span>
                  <div>
                    <p className="font-medium text-sm">
                      {item.questionId}.{item.part.id.split("-").pop()}
                    </p>
                    <p className="line-clamp-1 text-muted-foreground text-xs">
                      {item.part.text ?? t("exam.questionText")}
                    </p>
                  </div>
                </div>
              </button>
              {isExpanded && (
                <div className="flex flex-col gap-3 border-border border-t px-4 pt-3 pb-4">
                  {item.part.text && (
                    <div className="text-sm">
                      <MarkdownRenderer content={item.part.text} />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="mb-1 text-muted-foreground text-xs">{t("exam.yourAnswer")}</p>
                      <p className="rounded-lg bg-muted p-2 font-mono text-xs">
                        {getAnswerText(item.part, answers[fullId]) || t("exam.noAnswer")}
                      </p>
                    </div>
                    {!result.correct && (
                      <div>
                        <p className="mb-1 text-muted-foreground text-xs">
                          {t("exam.correctAnswer")}
                        </p>
                        <p className="rounded-lg bg-success/10 p-2 font-mono text-success text-xs">
                          {getCorrectAnswerText(item.part) || t("exam.notAvailable")}
                        </p>
                      </div>
                    )}
                  </div>
                  {item.part.marks && (
                    <p className="text-muted-foreground text-xs">
                      {t("exam.marks", {
                        score: result.score,
                        marks: item.part.marks,
                      })}
                    </p>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {failedCount > 0 && onReview && (
          <Button variant="secondary" onClick={onReview}>
            <HugeiconsIcon icon={RefreshIcon} data-icon="inline-start" />
            {t("exam.reviewMistakes")}
          </Button>
        )}
        <ShareResultButton
          cardParams={{
            score: correctCount,
            total: totalCount,
            percentage: accuracy,
            title: isMock
              ? `${t("exam.mockExam")} - ${t("exam.examHeading", { subject: _metadata.subject })}`
              : t("exam.examHeading", { subject: _metadata.subject }),
            subtitle: `${getAPSForSubject(accuracy)}/7 APS \u00B7 ${getGrade(accuracy)}`,
            type: "exam",
          }}
          text={t("exam.shareText", {
            percentage: accuracy,
            subject: _metadata.subject,
          })}
        />
        <Button onClick={onDashboard}>
          <HugeiconsIcon icon={Home01Icon} data-icon="inline-start" />
          {t("exam.dashboard")}
        </Button>
      </div>
    </FadeIn>
  );
}
