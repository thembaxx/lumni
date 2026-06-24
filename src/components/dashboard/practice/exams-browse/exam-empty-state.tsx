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
    </FadeIn>
  );
}
