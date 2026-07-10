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
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { StaggeredSection } from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { springPresets } from "@/lib/utils/spring-presets";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services";

const PracticeTab = dynamic(
  () => import("@/components/dashboard/practice-tab").then((m) => m.PracticeTab),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col gap-4 px-4">
        <Skeleton className="h-32 rounded-card" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-24 rounded-card" />
          <Skeleton className="h-24 rounded-card" />
        </div>
        <Skeleton className="h-40 rounded-card" />
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-20 rounded-card" />
          <Skeleton className="h-20 rounded-card" />
        </div>
        <Skeleton className="h-48 rounded-card" />
        <Skeleton className="h-64 rounded-card" />
      </div>
    ),
  },
);

export function DashboardContent({
  onStartQuiz,
  activeTab,
  id,
  boltStreak = 0,
}: {
  onStartQuiz: (subject: string) => void;
  activeTab: TabValue;
  id?: string;
  boltStreak?: number;
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
      className="flex h-full w-full flex-col overflow-y-auto bg-system-grouped pt-8"
    >
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="gap-4 sm:gap-5 lg:gap-6">
        <LoginBanner />
        {activeTab === "today" && (
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springPresets.standard,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
          >
            <HeroBanner />
            {isLoggedIn && <CountdownHeader />}
            <TodayTab boltStreak={boltStreak} />
          </m.div>
        )}
        {activeTab === "practice" && (
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springPresets.standard,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
          >
            <PracticeTab onStartQuiz={onStartQuiz} />
          </m.div>
        )}
        {activeTab === "analytics" && (
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              ...springPresets.standard,
              duration: prefersReducedMotion ? 0 : undefined,
            }}
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
