"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
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
    <FadeIn direction="up" distance={10} className="grow">
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-8 text-muted-foreground/40" />
          </EmptyMedia>
          <EmptyTitle className="text-base">No exams here… yet!</EmptyTitle>
          <EmptyDescription>
            {hasActiveFilters
              ? "No exams match your current filters. Try adjusting subject, year, or paper type to find what you need."
              : "Exams will appear here once they&apos;re uploaded. You can also search by subject name to find past papers faster."}
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
    </FadeIn>
  );
}
