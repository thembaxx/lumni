"use client";

import { useEffect, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePastQuestions } from "@/hooks/use-past-questions";
import { useRouter } from "@/i18n/navigation";

const QOTD_KEY = "lumni-qotd-date";

function getTodayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function getSubjectsForQotd(): string[] {
  return [
    "mathematics",
    "physical-sciences",
    "life-sciences",
    "accounting",
    "geography",
    "economics",
    "business-studies",
    "history",
    "english-home-language",
  ];
}

export function QuestionOfTheDayCard() {
  const { push } = useRouter();
  const [showAnswer, setShowAnswer] = useState(false);
  const [mounted, setMounted] = useState(false);

  const subjects = useMemo(() => getSubjectsForQotd(), []);
  const randomSubject = useMemo(
    () => subjects[Math.floor(Math.random() * subjects.length)],
    [subjects],
  );

  const [shown, setShown] = useState(false);

  // react-doctor/no-initialize-state — hydration guard + localStorage read, must run after mount
  useEffect(() => {
    setMounted(true);
    const lastShown = localStorage.getItem(QOTD_KEY);
    if (lastShown === getTodayKey()) return;
    localStorage.setItem(QOTD_KEY, getTodayKey());
    setShown(true);
  }, []);

  const { data, isPending } = usePastQuestions({
    subject: randomSubject,
    limit: 1,
    enabled: shown,
  });

  if (!mounted || !shown || isPending) return null;
  if (!data || data.questions.length === 0) return null;

  const question = data.questions[0];

  return (
    <div className="card-entrance">
      <Card className="overflow-hidden rounded-card shadow-level-1">
        <CardHeader>
          <CardTitle className="font-bold text-lg">Question of the Day</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 p-5 pt-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-xs">
              {question.subject}
            </Badge>
            <Badge variant="outline" className="rounded-full text-xs">
              {question.year} P{question.paperNumber}
            </Badge>
            {question.marks > 0 && (
              <span className="text-muted-foreground text-xs">{question.marks} marks</span>
            )}
          </div>

          <div className="text-pretty text-sm leading-relaxed">
            <MarkdownRenderer
              content={
                showAnswer
                  ? `${question.questionText}\n\n**Answer:** ${question.answerText}`
                  : question.questionText
              }
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAnswer(!showAnswer)}
              className="text-xs"
            >
              {showAnswer ? "Hide Answer" : "Reveal Answer"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => push(`/quiz?subject=${encodeURIComponent(question.subject)}&count=5`)}
              className="text-xs"
            >
              Practice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
