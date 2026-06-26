"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/shared/empty-state";

export function ExamErrorState() {
  return (
    <FadeIn direction="up" distance={10} className="grow">
      <Empty className="border border-destructive/30 border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HugeiconsIcon icon={BookOpen01Icon} className="size-6 text-destructive" />
          </EmptyMedia>
          <EmptyTitle>We hit a little snag</EmptyTitle>
          <EmptyDescription>
            We couldn&apos;t fetch your exams right now. Check your connection and try again.
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-3 pt-4">
          <Button size="sm" onClick={() => window.location.reload()}>
            <HugeiconsIcon icon={RefreshIcon} className="size-4" data-icon="inline-start" />
            Try again
          </Button>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/quiz")}>
            Browse subjects
          </Button>
        </div>
      </Empty>
    </FadeIn>
  );
}
