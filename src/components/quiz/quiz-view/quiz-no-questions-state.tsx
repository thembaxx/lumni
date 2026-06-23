"use client";

import { useTranslations } from "next-intl";
import { QuizEmptyState } from "@/components/quiz";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizNoQuestionsStateProps {
  selectedSubject: string;
  onBack: () => void;
  warning?: string;
}

export function QuizNoQuestionsState({
  selectedSubject,
  onBack,
  warning,
}: QuizNoQuestionsStateProps) {
  const t = useTranslations();

  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
      <div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
        <Card size="sm" className="w-full max-w-md">
          <CardContent>
            <CardTitle className="font-extrabold text-xl tracking-tight">
              {t("quiz.noQuestions")}
            </CardTitle>
            <QuizEmptyState variant="no-questions" subject={selectedSubject} onBack={onBack} />
            {warning && (
              <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-warning text-xs">
                {warning}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <DecorativeRightPanel />
    </div>
  );
}
