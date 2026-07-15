"use client";

import { useEffect } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { LoginBanner } from "@/components/dashboard/login-banner";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services";

export function DashboardContent({
  onStartQuiz,
  id,
  boltStreak = 0,
}: {
  onStartQuiz: (subject: string) => void;
  id?: string;
  boltStreak?: number;
}) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  useEffect(() => {
    if (isLoggedIn) {
      return initializeNotificationSchedulers();
    }
  }, [isLoggedIn]);

  return (
    <div id={id} className="flex h-full w-full flex-col overflow-y-auto bg-system-grouped">
      <AmbientGradient variant="dashboard" />
      <div
        className="pointer-events-none fixed top-1/4 right-0 h-96 w-96 rounded-full bg-system-accent/3 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed bottom-1/4 left-0 h-64 w-64 rounded-full bg-system-accent/3 blur-3xl"
        aria-hidden="true"
      />
      <PageContainer className="relative z-elevated gap-4 pb-24 sm:pb-28 lg:pb-32 sm:gap-5 lg:gap-6">
        <LoginBanner />
        <DashboardView boltStreak={boltStreak} onStartQuiz={onStartQuiz} />
      </PageContainer>
    </div>
  );
}
