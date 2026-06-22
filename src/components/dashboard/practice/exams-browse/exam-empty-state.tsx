"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

interface ExamEmptyStateProps {
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export function ExamEmptyState({ hasActiveFilters, onClearFilters }: ExamEmptyStateProps) {
  return (
    <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grow">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-8 text-muted-foreground/40" />
          </EmptyMedia>
          <EmptyTitle className="text-base">No exams here… yet!</EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? "Try tweaking your filters to find what you&apos;re looking for."
              : "We&apos;re still gathering exams for you. Check back soon!"}
          </EmptyDescription>
        </EmptyHeader>
        {hasActiveFilters && (
          <EmptyContent>
            <Button variant="link" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          </EmptyContent>
        )}
      </Empty>
    </m.div>
  );
}
