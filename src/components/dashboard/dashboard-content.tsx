"use client";

import { Login01Icon } from "@hugeicons/core-free-icons";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AchievementShowcase } from "@/components/dashboard/achievement-showcase";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { DailyChallenges } from "@/components/dashboard/daily-challenges";
import { HeroBanner } from "@/components/dashboard/dashboard-hero";
import { MasteryHeatmap } from "@/components/dashboard/mastery-heatmap";
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
import { LeaderboardCard } from "@/components/social/leaderboard-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useAuth } from "@/lib/auth/auth-context";

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
					<Card className="flex h-full items-center justify-center rounded-3xl p-4 shadow-level-1">
						<DailyProgressRing />
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
	const { isAnonymous } = useAuth();
	const { gamification } = useGamification();

	const stats = {
		questionsAnswered:
			gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
		accuracy: 0,
	};

	const showPractice = activeTab === "today" || activeTab === "spaces";
	const showAnalytics = activeTab === "today" || activeTab === "analytics";

	const handleRefresh = async () => {
		window.location.reload();
	};

	return (
		<PullToRefresh
			data-scroll-container
			onRefresh={handleRefresh}
			className="flex min-h-dvh w-full flex-col overflow-y-auto overflow-x-hidden bg-system-grouped pt-8 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))]"
		>
			<PageContainer className="gap-8 pb-16">
				{activeTab === "today" && <HeroBanner />}
				{isAnonymous && (
					<LocalDataNotice
						page="dashboard"
						description={t("dashboard.localDataDescription")}
					/>
				)}
				{activeTab === "today" && !isAnonymous && <CountdownHeader />}
				{activeTab === "today" && (
					<SectionReveal delay={0.02}>
						<GettingStartedCard />
					</SectionReveal>
				)}
				{activeTab === "today" && (
					<SectionReveal delay={0.03}>
						<NotificationNudge />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.05}>
						<BentoStatRow
							questionsAnswered={stats.questionsAnswered}
							accuracy={stats.accuracy}
						/>
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.08}>
						<FocusTimerCard />
					</SectionReveal>
				)}
				{isAnonymous && (
					<SectionReveal delay={0.09}>
						<AnonymousUpsell />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.1}>
						<TodayFocusCard />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.105}>
						<MyAssignments />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.11}>
						<StreakCard />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.115}>
						<StudyPlanOverview />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.12}>
						<CompetencyOverview />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.13}>
						<BloomTaxonomyWidget />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.135}>
						<OfflinePackManager />
					</SectionReveal>
				)}
				{showPractice && !isAnonymous && (
					<SectionReveal delay={0.14}>
						<DailyChallenges />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.14}>
						<QuizStartCard onStart={onStartQuiz} />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.14}>
						<ComparativeAnalyticsPanel />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.16}>
						<StatsRow />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.17}>
						<LeaderboardCard />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.18}>
						<AchievementShowcase />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.185}>
						<RewardChestPanel />
					</SectionReveal>
				)}
				{showAnalytics && !isAnonymous && (
					<SectionReveal delay={0.19}>
						<Card className="flex flex-col gap-4 p-4">
							<h2 className="font-semibold text-sm">Mastery Heatmap</h2>
							<MasteryHeatmap />
						</Card>
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.19}>
						<StaggerList>
							<QuickActions />
						</StaggerList>
					</SectionReveal>
				)}
			</PageContainer>
		</PullToRefresh>
	);
}
