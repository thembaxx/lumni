"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import type { BoltResult } from "@/components/dashboard/daily-challenge-dialog";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LoginBanner } from "@/components/dashboard/login-banner";
import { TodayTab } from "@/components/dashboard/today-tab";
import type { TabValue } from "@/components/dashboard/types";
import { PageContainer } from "@/components/layout/page-container";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { StaggeredSection } from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services/notification-service";

const PracticeTab = dynamic(
  () => import("@/components/dashboard/practice-tab").then((m) => m.PracticeTab),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 px-4">
        <Skeleton className="h-32 rounded-3xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-3xl" />
          <Skeleton className="h-24 rounded-3xl" />
        </div>
        <Skeleton className="h-40 rounded-3xl" />
      </div>
    ),
  },
);

const AnalyticsTab = dynamic(
  () => import("@/components/dashboard/analytics-tab").then((m) => m.AnalyticsTab),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 px-4">
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
          <Skeleton className="h-20 rounded-3xl" />
        </div>
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-64 rounded-3xl" />
      </div>
    ),
  },
);

async function refreshPage(): Promise<void> {
  window.location.reload();
}

export function DashboardContent({
  onStartQuiz,
  activeTab,
  onBoltComplete,
  boltStreak,
  id,
}: {
  onStartQuiz: (subject: string) => void;
  activeTab: TabValue;
  onBoltComplete: (result: BoltResult) => void;
  boltStreak: number;
  id?: string;
}) {
  const t = useTranslations();
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;

  useEffect(() => {
    if (isLoggedIn) {
      initializeNotificationSchedulers();
    }
  }, [isLoggedIn]);

  return (
    <PullToRefresh
      id={id}
      data-scroll-container
      onRefresh={refreshPage}
      className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-system-grouped pt-8"
    >
      <PageContainer className="gap-6 pb-16">
        <LoginBanner />
        {isAnonymous && (
          <LocalDataNotice page="dashboard" description={t("dashboard.localDataDescription")} />
        )}
        {activeTab === "today" && (
          <>
            <HeroBanner />
            {isLoggedIn && <CountdownHeader />}
            <TodayTab boltStreak={boltStreak} onBoltComplete={onBoltComplete} />
          </>
        )}
        {activeTab === "practice" && <PracticeTab onStartQuiz={onStartQuiz} />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {(activeTab === "practice" || activeTab === "analytics") && isAnonymous && (
          <StaggeredSection>
            <AnonymousUpsell />
          </StaggeredSection>
        )}
      </PageContainer>
    </PullToRefresh>
  );
}
