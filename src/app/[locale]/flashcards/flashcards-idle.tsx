"use client";

import Book02Icon from "@hugeicons/core-free-icons/Book02Icon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { motionEase } from "@/lib/utils/animation";

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
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="flex items-center justify-center p-4">
      <div className="card-elevated w-full max-w-md overflow-hidden rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2">
        <m.div
          initial={prefersReducedMotion ? undefined : { opacity: 0, y: 12 }}
          animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? undefined : { duration: 0.3, ease: motionEase }}
        >
          <header className="pb-4 text-left">
            <h1 className="ios-title-1 font-bold text-foreground tracking-tight">
              {t("flashcards.title")}
            </h1>
          </header>
        </m.div>
        <div className="flex flex-col gap-4">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={BulbIcon} className="size-8" />
              </EmptyMedia>
              <EmptyTitle>{t("flashcards.readyToStart")}</EmptyTitle>
              <EmptyDescription>{t("flashcards.generateOrReview")}</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <div className="flex flex-col gap-3">
                <SubjectsDrawer onSelect={onSelect}>
                  <Button>
                    {t("flashcards.generateAiFlashcards")}
                    <HugeiconsIcon icon={BulbIcon} className="ml-1 size-4" />
                  </Button>
                </SubjectsDrawer>
                <SubjectsDrawer onSelect={onReviewMistakes}>
                  <Button variant="outline">
                    {t("flashcards.reviewMistakes")}
                    <HugeiconsIcon icon={RefreshIcon} className="ml-1 size-4" />
                  </Button>
                </SubjectsDrawer>
                <SubjectsDrawer onSelect={onReviewVocabulary}>
                  <Button variant="outline">
                    {t("flashcards.reviewVocabulary")}
                    <HugeiconsIcon icon={Book02Icon} className="ml-1 size-4" />
                  </Button>
                </SubjectsDrawer>
              </div>
            </EmptyContent>
          </Empty>
        </div>
      </div>
    </div>
  );
}
