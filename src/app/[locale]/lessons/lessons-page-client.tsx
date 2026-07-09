"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { SpotlightCard } from "@/components/shared/motion-primitives";
import { PageContainer } from "@/components/layout/page-container";
import { motionEase } from "@/lib/utils/animation";
import { LessonLibrary } from "@/components/lesson/lesson-library";

export function LessonsPageClient() {
  const prefersReducedMotion = useReducedMotion();
  return (
    <div className="min-h-dvh bg-system-grouped pt-4">
      <AmbientGradient variant="study" />
      <PageContainer className="flex flex-col gap-6">
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: prefersReducedMotion ? 0 : 0.3, ease: motionEase }}
        >
          <h1 className="ios-title-1 font-bold text-foreground tracking-tight">Lessons</h1>
        </m.div>
        <SpotlightCard className="rounded-card-lg">
          <LessonLibrary />
        </SpotlightCard>
      </PageContainer>
    </div>
  );
}
