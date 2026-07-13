"use client";

import * as m from "motion/react-m";
import { GroupSkeleton } from "@/components/dashboard/practice/exam-card-skeleton";

export function ExamLoadingState() {
  return (
    <m.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex grow flex-col gap-5"
    >
      <GroupSkeleton />
      <GroupSkeleton />
      <GroupSkeleton />
    </m.div>
  );
}
