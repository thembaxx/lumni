"use client";

import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";

const YEARS = [2025, 2024, 2023, 2022, 2021] as const;
const LANGUAGES = ["all", "english", "afrikaans"] as const;

interface ExamFiltersProps {
  selectedSubject: string;
  selectedYear: number | null;
  selectedSession: string;
  selectedLanguage: string;
  hasActiveFilters: boolean;
  onSubjectChange: (subject: string) => void;
  onYearChange: (year: number | null) => void;
  onSessionChange: (session: string) => void;
  onLanguageChange: (language: string) => void;
  onClearFilters: () => void;
}

export function ExamFilters({
  selectedSubject,
  selectedYear,
  selectedSession,
  selectedLanguage,
  hasActiveFilters,
  onSubjectChange,
  onYearChange,
  onSessionChange,
  onLanguageChange,
  onClearFilters,
}: ExamFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <SubjectsDrawer onSelect={onSubjectChange}>
            <Button
              variant={selectedSubject ? "default" : "secondary"}
              size="sm"
              className="border"
            >
              {selectedSubject || "Subject"}
              <HugeiconsIcon icon={ArrowDown01Icon} className="ml-1" data-icon />
            </Button>
          </SubjectsDrawer>
          <ButtonGroup className="h-9 rounded-full border">
            {LANGUAGES.map((lang) => (
              <Button
                key={lang}
                variant={selectedLanguage === lang ? "default" : "secondary"}
                size="sm"
                onClick={() => onLanguageChange(lang)}
              >
                {lang === "all" ? "All" : lang === "english" ? "EN" : "AF"}
              </Button>
            ))}
          </ButtonGroup>
        </div>

        <ButtonGroup className="h-9 rounded-full border">
          <Button
            variant={selectedSession === "all" ? "default" : "secondary"}
            size="sm"
            onClick={() => onSessionChange("all")}
          >
            All
          </Button>
          <Button
            variant={selectedSession === "may" ? "default" : "secondary"}
            size="sm"
            onClick={() => onSessionChange("may")}
          >
            Jun
          </Button>
          <Button
            variant={selectedSession === "nov" ? "default" : "secondary"}
            size="sm"
            onClick={() => onSessionChange("nov")}
          >
            Nov
          </Button>
        </ButtonGroup>

        <AnimatePresence initial={false}>
          {hasActiveFilters && (
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 0.9 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={onClearFilters}
                variant="ghost"
                size="sm"
                className="text-muted-foreground transition-[scale] hover:text-foreground active:scale-[0.96]"
                aria-label="Clear filters"
              >
                <HugeiconsIcon icon={Cancel01Icon} data-icon />
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className="scrollbar-hide -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
        <Button
          variant={selectedYear === null ? "default" : "secondary"}
          size="sm"
          className="shrink-0"
          onClick={() => onYearChange(null)}
        >
          All
        </Button>
        {YEARS.map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? "default" : "secondary"}
            size="sm"
            className="shrink-0"
            onClick={() => onYearChange(year)}
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );
}
