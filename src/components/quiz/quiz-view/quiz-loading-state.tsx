"use client";

import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizLoadingStateProps {
  resolvedTopic?: string;
  topicCompetencyLevel?: string;
  topicCompetencyScore?: number;
}

export function QuizLoadingState({
  resolvedTopic,
  topicCompetencyLevel,
  topicCompetencyScore,
}: QuizLoadingStateProps) {
  const t = useTranslations();

  return (
    <div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
      <div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-(--space-20) md:col-span-7">
        <Card size="sm" className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-6 p-8 text-center">
            <div className="flex items-center gap-1.5" role="status" aria-label="Loading questions">
              {[0, 1, 2].map((i) => (
                <m.div
                  key={i}
                  className="size-2.5 rounded-full bg-system-accent"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut" as const,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </div>
            <m.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-2"
            >
              <p className="font-medium text-foreground text-sm">{t("quiz.preparingQuestions")}</p>
              {resolvedTopic && topicCompetencyLevel && (
                <div className="flex flex-col gap-0.5">
                  <p className="text-muted-foreground text-xs">
                    {t("quiz.focusingOn", { topic: resolvedTopic })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t("quiz.level", {
                      level: topicCompetencyLevel,
                    })}
                    {topicCompetencyScore !== undefined &&
                      t("quiz.scorePercent", {
                        score: topicCompetencyScore,
                      })}
                  </p>
                </div>
              )}
            </m.div>
          </CardContent>
        </Card>
      </div>
      <DecorativeRightPanel />
    </div>
  );
}
