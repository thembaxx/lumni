"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { FadeIn } from "@/components/shared/fade-in";
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
            We couldn&apos;t fetch your exams right now. Let&apos;s give it another shot!
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    </FadeIn>
  );
}
