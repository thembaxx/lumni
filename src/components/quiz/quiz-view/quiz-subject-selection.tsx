"use client";

import File01Icon from "@hugeicons/core-free-icons/File01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { QuizSelectSubject } from "@/components/quiz";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizSubjectSelectionProps {
  onSelect: (subject: string) => void;
  pastPaperMode?: boolean;
  onPastPaperModeChange?: (v: boolean) => void;
}

export function QuizSubjectSelection({
  onSelect,
  pastPaperMode = false,
  onPastPaperModeChange,
}: QuizSubjectSelectionProps) {
  const t = useTranslations();

  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
      <div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
        <Card size="sm" className="w-full max-w-md">
          <CardContent className="flex flex-col gap-4">
            <CardTitle className="ios-title-2 font-bold tracking-tight">
              {t("quiz.title")}
            </CardTitle>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={File01Icon} className="size-4 text-muted-foreground" />
                <label htmlFor="past-paper-toggle" className="text-foreground text-sm">
                  {t("quiz.pastPaperMode")}
                </label>
              </div>
              <Switch
                id="past-paper-toggle"
                checked={pastPaperMode}
                onCheckedChange={onPastPaperModeChange ?? (() => {})}
              />
            </div>
            <QuizSelectSubject onSelect={onSelect} />
          </CardContent>
        </Card>
      </div>
      <DecorativeRightPanel />
    </div>
  );
}
