"use client";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { SessionQuestionNavigator } from "@/components/exam";
import type { QuestionPart } from "@/types/exam-paper";
import { springPresets } from "@/lib/utils/spring-presets";

interface QuestionNavigatorSidebarProps {
  showPalette: boolean;
  flatParts: Array<{
    sectionId: string;
    questionId: string;
    part: QuestionPart;
  }>;
  currentPartId: string | null;
  answers: Record<string, { value: string | string[] }>;
  flags: string[];
  onNavigate: (partId: string) => void;
  onClose?: () => void;
}

const navigatorContent = (
  t: (key: string) => string,
  flatParts: Array<{ sectionId: string; questionId: string; part: QuestionPart }>,
  currentPartId: string | null,
  answers: Record<string, { value: string | string[] }>,
  flags: string[],
  onNavigate: (partId: string) => void,
) => (
  <>
    <p className="mb-3 font-semibold text-muted-foreground text-xs">
      {t("exam.questionNavigator")}
    </p>
    <SessionQuestionNavigator
      totalParts={flatParts}
      currentPartId={currentPartId}
      answers={answers}
      flags={flags}
      onNavigate={onNavigate}
    />
  </>
);

export function QuestionNavigatorSidebar({
  showPalette,
  flatParts,
  currentPartId,
  answers,
  flags,
  onNavigate,
  onClose,
}: QuestionNavigatorSidebarProps) {
  const t = useTranslations();

  return (
    <>
      <AnimatePresence initial={false}>
        {showPalette && (
          <m.aside
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            className="hidden overflow-hidden border-border border-r bg-muted/20 md:block"
          >
            <div className="w-64 p-4">
              {navigatorContent(t, flatParts, currentPartId, answers, flags, onNavigate)}
            </div>
          </m.aside>
        )}
      </AnimatePresence>

      {showPalette && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => onClose?.()}
            aria-hidden="true"
          />
          <m.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={springPresets.standard}
            className="relative h-full w-64 bg-background p-4 shadow-2xl"
          >
            {navigatorContent(t, flatParts, currentPartId, answers, flags, onNavigate)}
          </m.aside>
        </div>
      )}
    </>
  );
}
