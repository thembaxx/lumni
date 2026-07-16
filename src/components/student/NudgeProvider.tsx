"use client";

import { StudentNudgeBanner } from "@/components/student/nudge-banner";

export function NudgeProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <StudentNudgeBanner />
    </>
  );
}
