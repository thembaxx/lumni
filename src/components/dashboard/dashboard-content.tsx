"use client";

import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import { useEffect } from "react";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LoginBanner } from "@/components/dashboard/login-banner";
import { TodayTab } from "@/components/dashboard/today-tab";
import type { TabValue } from "@/components/dashboard/types";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { PageContainer } from "@/components/layout/page-container";
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
        <Skeleton className="h-32 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl" />
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
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    ),
  },
);

export function DashboardContent({
  onStartQuiz,
  activeTab,
  id,
}: {
  onStartQuiz: (subject: string) => void;
  activeTab: TabValue;
  id?: string;
}) {
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (isLoggedIn) {
      initializeNotificationSchedulers();
    }
  }, [isLoggedIn]);

  return (
    <PullToRefresh
      id={id}
      data-scroll-container
      onRefresh={async () => {
        window.location.reload();
      }}
      className="flex h-full w-full flex-col overflow-y-auto overflow-x-hidden bg-system-grouped pt-8"
    >
      <AmbientGradient />
      <PageContainer className="gap-6 pb-16">
        <LoginBanner />
        {activeTab === "today" && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <HeroBanner />
            {isLoggedIn && <CountdownHeader />}
            <TodayTab boltStreak={0} />
          </m.div>
        )}
        {activeTab === "practice" && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <PracticeTab onStartQuiz={onStartQuiz} />
          </m.div>
        )}
        {activeTab === "analytics" && (
          <m.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
          >
            <AnalyticsTab />
          </m.div>
        )}
        {(activeTab === "practice" || activeTab === "analytics") && isAnonymous && (
          <StaggeredSection>
            <AnonymousUpsell />
          </StaggeredSection>
        )}
      </PageContainer>
    </PullToRefresh>
  );
}
