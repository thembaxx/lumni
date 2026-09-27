"use client";

import Book02Icon from "@hugeicons/core-free-icons/Book02Icon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface FlashcardsIdleProps {
  onSelect: (subject: string) => void;
  onReviewMistakes: (subject: string) => void;
  onReviewVocabulary: (subject: string) => void;
}

export function FlashcardsIdle({
  onSelect,
  onReviewMistakes,
  onReviewVocabulary,
}: FlashcardsIdleProps) {
  const t = useTranslations();
  return (
    <div className="flex items-center justify-center p-4 py-12">
      <Card variant="hero" className="w-full max-w-md p-6 text-foreground">
        <CardHeader className="pb-4">
          <CardTitle className="font-display font-extrabold text-2xl">
            {t("flashcards.title")}
          </CardTitle>
          <CardDescription className="text-sm text-[var(--fg-muted)]">
            {t("flashcards.readyToStart")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            <SubjectsDrawer onSelect={onSelect}>
              <Button variant="primary" size="lg" className="w-full justify-between">
                <span>{t("flashcards.generateAiFlashcards")}</span>
                <HugeiconsIcon icon={BulbIcon} className="size-4" />
              </Button>
            </SubjectsDrawer>
            <SubjectsDrawer onSelect={onReviewMistakes}>
              <Button variant="outline" size="lg" className="w-full justify-between">
                <span>{t("flashcards.reviewMistakes")}</span>
                <HugeiconsIcon icon={RefreshIcon} className="size-4" />
              </Button>
            </SubjectsDrawer>
            <SubjectsDrawer onSelect={onReviewVocabulary}>
              <Button variant="outline" size="lg" className="w-full justify-between">
                <span>{t("flashcards.reviewVocabulary")}</span>
                <HugeiconsIcon icon={Book02Icon} className="size-4" />
              </Button>
            </SubjectsDrawer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
