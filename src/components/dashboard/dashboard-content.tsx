"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AnalyticsTab } from "@/components/dashboard/analytics-tab";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import type { BoltResult } from "@/components/dashboard/daily-challenge-dialog";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LoginBanner } from "@/components/dashboard/login-banner";
import { PracticeTab } from "@/components/dashboard/practice-tab";
import { TodayTab } from "@/components/dashboard/today-tab";
import type { TabValue } from "@/components/dashboard/types";
import { PageContainer } from "@/components/layout/page-container";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { StaggeredSection } from "@/components/shared/stagger-provider";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services/notification-service";

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
				{activeTab === "today" && <HeroBanner />}
				{isAnonymous && (
					<LocalDataNotice
						page="dashboard"
						description={t("dashboard.localDataDescription")}
					/>
				)}
				{activeTab === "today" && isLoggedIn && <CountdownHeader />}
				{activeTab === "today" && (
					<TodayTab boltStreak={boltStreak} onBoltComplete={onBoltComplete} />
				)}
				{activeTab === "practice" && <PracticeTab onStartQuiz={onStartQuiz} />}
				{activeTab === "analytics" && <AnalyticsTab />}
				{(activeTab === "practice" || activeTab === "analytics") &&
					isAnonymous && (
						<StaggeredSection>
							<AnonymousUpsell />
						</StaggeredSection>
					)}
			</PageContainer>
		</PullToRefresh>
	);
}
