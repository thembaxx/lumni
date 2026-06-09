"use client";

import {
	Lightning,
	Login01Icon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { AchievementShowcase } from "@/components/dashboard/achievement-showcase";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { DailyChallenges } from "@/components/dashboard/daily-challenges";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { LearningMapCard } from "@/components/dashboard/learning-map-card";
import { LoginBanner } from "@/components/dashboard/login-banner";
import { MasteryHeatmap } from "@/components/dashboard/mastery-heatmap";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { QuestionOfTheDayCard } from "@/components/dashboard/question-of-the-day-card";
import { RecentQuestionsCard } from "@/components/dashboard/recent-questions-card";
import { StudyCard } from "@/components/dashboard/study-card";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";

async function refreshPage(): Promise<void> {
	window.location.reload();
}

import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { QuizStartCard } from "@/components/dashboard/quiz-start-card";
import { SectionReveal } from "@/components/dashboard/section-reveal";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatsRow } from "@/components/dashboard/stats-row";
import { StreakCard } from "@/components/dashboard/streak-card";
import { StudyPlanOverview } from "@/components/dashboard/study-plan-overview";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import type { TabValue } from "@/components/dashboard/types";
import { RewardChestPanel } from "@/components/gamification/reward-chest/reward-chest-panel";
import { PageContainer } from "@/components/layout/page-container";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { NotificationNudge } from "@/components/onboarding/notification-nudge";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { PullToRefresh } from "@/components/shared/pull-to-refresh";
import { StaggerList } from "@/components/shared/stagger-list";
import {
	StaggeredSection,
	StaggerProvider,
} from "@/components/shared/stagger-provider";
import { LeaderboardCard } from "@/components/social/leaderboard-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services/notification-service";

const CompetencyOverview = dynamic(
	() =>
		import("@/components/dashboard/competency-overview").then(
			(m) => m.CompetencyOverview,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-3xl" /> },
);

const OfflinePackManager = dynamic(
	() =>
		import("@/components/dashboard/offline-packs").then(
			(m) => m.OfflinePackManager,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-3xl" /> },
);

const MyAssignments = dynamic(
	() =>
		import("@/components/dashboard/my-assignments").then(
			(m) => m.MyAssignments,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-32 rounded-3xl" />,
	},
);

const BloomTaxonomyWidget = dynamic(
	() =>
		import("@/components/dashboard/bloom-taxonomy-widget").then(
			(m) => m.BloomTaxonomyWidget,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-48 rounded-3xl" />,
	},
);

const DailyProgressRing = dynamic(
	() =>
		import("@/components/dashboard/daily-progress-ring").then(
			(m) => m.DailyProgressRing,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="size-full rounded-3xl" />,
	},
);

const FocusTimerCard = dynamic(
	() =>
		import("@/components/dashboard/focus-timer-card").then(
			(m) => m.FocusTimerCard,
		),
	{ ssr: false, loading: () => <Skeleton className="h-20 rounded-3xl" /> },
);

const ComparativeAnalyticsPanel = dynamic(
	() =>
		import("@/components/dashboard/analytics/comparative-analytics-panel").then(
			(mod) => mod.ComparativeAnalyticsPanel,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-64 items-center justify-center rounded-3xl border border-dashed bg-system-surface">
				<Skeleton className="h-full w-full rounded-3xl" />
			</div>
		),
	},
);

function BentoStatRow({
	questionsAnswered,
	accuracy,
}: {
	questionsAnswered: number;
	accuracy: number;
}) {
	return (
		<div className="grid grid-cols-12 gap-3">
			<div className="col-span-12 sm:col-span-8">
				<StatsCards questionsAnswered={questionsAnswered} accuracy={accuracy} />
			</div>
			<div className="col-span-12 sm:col-span-4">
				<SectionReveal delay={0.12}>
					<Card className="flex h-full items-center justify-center rounded-3xl shadow-level-1">
						<CardContent className="p-4">
							<DailyProgressRing />
						</CardContent>
					</Card>
				</SectionReveal>
			</div>
		</div>
	);
}

function AnonymousUpsell() {
	const t = useTranslations();
	return (
		<div className="rounded-3xl border border-dashed bg-system-surface p-8 shadow-level-1">
			<EmptyStateWithIllustration
				icon={Login01Icon}
				title={t("dashboard.signInTitle")}
				description={t("dashboard.signInDescription")}
				action={{
					label: t("dashboard.signInAction"),
					onClick: () => {
						window.location.href = "/auth/sign-in?redirect=/dashboard";
					},
				}}
				secondaryAction={{
					label: t("dashboard.createAccount"),
					onClick: () => {
						window.location.href = "/auth/sign-up?redirect=/dashboard";
					},
				}}
			/>
		</div>
	);
}

export function DashboardContent({
	onStartQuiz,
	activeTab,
}: {
	onStartQuiz: (subject: string) => void;
	activeTab: TabValue;
}) {
	const t = useTranslations();
	const { user, isAnonymous } = useAuth();
	const { gamification } = useGamification();
	const isLoggedIn = !!user && !isAnonymous;

	useEffect(() => {
		initializeNotificationSchedulers();
	}, []);

	const stats = {
		questionsAnswered:
			gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
		accuracy: 0,
	};

	const showPractice = activeTab === "today" || activeTab === "spaces";
	const showAnalytics = activeTab === "today" || activeTab === "analytics";

	const handleRefresh = refreshPage;

	const todayStr = new Date().toDateString();
	const boltDone = gamification.lastPracticeDate === todayStr;

	return (
		<PullToRefresh
			data-scroll-container
			onRefresh={handleRefresh}
			className="flex min-h-dvh w-full flex-col overflow-y-auto overflow-x-hidden bg-system-grouped pt-8 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))]"
		>
			<PageContainer className="gap-8 pb-16">
				<LoginBanner />
				{activeTab === "today" && <HeroBanner />}
				{activeTab === "today" && boltDone && (
					<div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/8 px-4 py-3 transition-[background-color] duration-300">
						<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/20">
							<HugeiconsIcon
								icon={SparklesIcon}
								className="size-5 text-success"
							/>
						</div>
						<div className="flex min-w-0 flex-col gap-0.5">
							<span className="font-semibold text-sm text-success-foreground">
								Today&rsquo;s Bolt complete
							</span>
							<span className="text-success-foreground/70 text-xs">
								Come back tomorrow to keep learning
							</span>
						</div>
						<div className="ml-auto flex size-8 items-center justify-center rounded-full bg-warning/10">
							<HugeiconsIcon icon={Lightning} className="size-4 text-warning" />
						</div>
					</div>
				)}
				{isAnonymous && (
					<LocalDataNotice
						page="dashboard"
						description={t("dashboard.localDataDescription")}
					/>
				)}
				{activeTab === "today" && isLoggedIn && <CountdownHeader />}
				<StaggerProvider baseDelay={0.02}>
					{activeTab === "today" && (
						<StaggeredSection>
							<GettingStartedCard />
						</StaggeredSection>
					)}
					{activeTab === "today" && (
						<StaggeredSection>
							<NotificationNudge />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<BentoStatRow
								questionsAnswered={stats.questionsAnswered}
								accuracy={stats.accuracy}
							/>
						</StaggeredSection>
					)}
					{showPractice && (
						<StaggeredSection>
							<FocusTimerCard />
						</StaggeredSection>
					)}
					{isAnonymous && (
						<StaggeredSection>
							<AnonymousUpsell />
						</StaggeredSection>
					)}
					{showPractice && (
						<StaggeredSection>
							<QuestionOfTheDayCard />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<AppErrorBoundary>
								<NextBestActionCard />
							</AppErrorBoundary>
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<TodayFocusCard />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<AppErrorBoundary>
								<LearningMapCard />
							</AppErrorBoundary>
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<MyAssignments />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<StudyCard />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<StreakCard />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<RecentQuestionsCard />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<StudyPlanOverview />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<CompetencyOverview />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<BloomTaxonomyWidget />
						</StaggeredSection>
					)}
					{showPractice && (
						<StaggeredSection>
							<OfflinePackManager />
						</StaggeredSection>
					)}
					{showPractice && isLoggedIn && (
						<StaggeredSection>
							<DailyChallenges />
						</StaggeredSection>
					)}
					{showPractice && (
						<StaggeredSection>
							<QuizStartCard onStart={onStartQuiz} />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<ComparativeAnalyticsPanel />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<StatsRow />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<LeaderboardCard />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<AchievementShowcase />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<RewardChestPanel />
						</StaggeredSection>
					)}
					{showAnalytics && isLoggedIn && (
						<StaggeredSection>
							<Card>
								<CardHeader>
									<CardTitle className="font-extrabold text-base tracking-tight">
										Mastery Heatmap
									</CardTitle>
								</CardHeader>
								<CardContent>
									<MasteryHeatmap />
								</CardContent>
							</Card>
						</StaggeredSection>
					)}
					{showPractice && (
						<StaggeredSection>
							<StaggerList>
								<QuickActions />
							</StaggerList>
						</StaggeredSection>
					)}
				</StaggerProvider>
			</PageContainer>
		</PullToRefresh>
	);
}
