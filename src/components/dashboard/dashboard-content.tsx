"use client";

import { useEffect } from "react";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs";
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
      <PageContainer className="relative z-elevated flex flex-col gap-4 pb-24 sm:gap-5 sm:pb-28 lg:gap-6 lg:pb-32">
        <LoginBanner />
        {isLoggedIn && <DashboardTabs />}
        <DashboardView boltStreak={boltStreak} onStartQuiz={onStartQuiz} />
      </PageContainer>
    </div>
  );
}
