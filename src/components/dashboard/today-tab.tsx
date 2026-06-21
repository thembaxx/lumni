"use client";

import { Lightning, SparklesIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { AnonymousUpsell } from "@/components/dashboard/anonymous-upsell";
import { BentoStatRow } from "@/components/dashboard/bento-stat-row";
import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";
import type { BoltResult } from "@/components/dashboard/daily-challenge-dialog";
import { LearningMapCard } from "@/components/dashboard/learning-map-card";
import { NextBestActionCard } from "@/components/dashboard/next-best-action";
import { QuestionOfTheDayCard } from "@/components/dashboard/question-of-the-day-card";
import { WordOfDayCard } from "@/components/dashboard/word-of-day";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { StreakCard } from "@/components/dashboard/streak-card";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { WeakTopicsCard } from "@/components/dashboard/weak-topics-card";
import { RewardChestPanel } from "@/components/gamification/reward-chest/reward-chest-panel";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { NotificationNudge } from "@/components/onboarding/notification-nudge";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { StaggerList } from "@/components/shared/stagger-list";
import {
	StaggeredSection,
	StaggerProvider,
} from "@/components/shared/stagger-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useAuth } from "@/lib/auth/auth-context";

const FocusTimerCard = dynamic(
	() =>
		import("@/components/dashboard/focus-timer-card").then(
			(m) => m.FocusTimerCard,
		),
	{ ssr: false, loading: () => <Skeleton className="h-20 rounded-4xl" /> },
);

const LessonLibraryCard = dynamic(
	() =>
		import("@/components/dashboard/lesson-library-card").then(
			(m) => m.LessonLibraryCard,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const VocabularyListCard = dynamic(
	() =>
		import("@/components/vocabulary/vocabulary-list-card").then(
			(m) => m.VocabularyListCard,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

interface TodayTabProps {
	boltStreak: number;
	onBoltComplete: (result: BoltResult) => void;
}

export function TodayTab({ boltStreak, onBoltComplete }: TodayTabProps) {
	const t = useTranslations();
	const { user, isAnonymous } = useAuth();
	const { gamification, currentStreak } = useGamification();
	const isLoggedIn = !!user && !isAnonymous;

	const stats = {
		questionsAnswered:
			gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
	};

	const todayStr = new Date().toDateString();
	const boltDone = gamification.lastPracticeDate === todayStr;

	return (
		<StaggerProvider baseDelay={0.02}>
			<section className="flex flex-col gap-3" aria-label="Get started">
				{isLoggedIn && (
					<StaggeredSection>
						<DailyChallengeCard
							onComplete={onBoltComplete}
							streak={boltStreak}
						/>
					</StaggeredSection>
				)}
				{isLoggedIn && boltDone && (
					<StaggeredSection>
						<div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success/5 px-4 py-3 transition-[background-color] duration-300">
							<div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success/20">
								<HugeiconsIcon
									icon={SparklesIcon}
									className="size-5 text-success"
								/>
							</div>
							<div className="flex min-w-0 flex-col gap-1">
								<span className="font-semibold text-sm text-success-foreground">
									{t("dashboard.boltCompleteTitle")}
								</span>
								<span className="text-success-foreground/70 text-xs">
									{t("dashboard.boltCompleteDescription")}
								</span>
							</div>
							<div className="ml-auto flex size-8 items-center justify-center rounded-full bg-warning/10">
								<HugeiconsIcon
									icon={Lightning}
									className="size-4 text-warning"
								/>
							</div>
						</div>
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<AppErrorBoundary>
							<NextBestActionCard />
						</AppErrorBoundary>
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<TodayFocusCard />
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<GettingStartedCard />
					</StaggeredSection>
				)}
				<StaggeredSection>
					<NotificationNudge />
				</StaggeredSection>
			</section>

			{isLoggedIn && (
				<section className="flex flex-col gap-3" aria-label="Your progress">
					<StaggeredSection>
						<BentoStatRow
							questionsAnswered={stats.questionsAnswered}
							streak={currentStreak}
						/>
					</StaggeredSection>
					<StaggeredSection>
						<StreakCard />
					</StaggeredSection>
				</section>
			)}

			<section className="flex flex-col gap-3" aria-label="Study tools">
				<StaggeredSection>
					<FocusTimerCard />
				</StaggeredSection>
				<StaggeredSection>
					<QuestionOfTheDayCard />
				</StaggeredSection>
				<StaggeredSection>
					<WordOfDayCard />
				</StaggeredSection>
				{isLoggedIn && (
					<StaggeredSection>
						<WeakTopicsCard />
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<LessonLibraryCard />
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<VocabularyListCard />
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<AppErrorBoundary>
							<LearningMapCard />
						</AppErrorBoundary>
					</StaggeredSection>
				)}
				{isLoggedIn && (
					<StaggeredSection>
						<RewardChestPanel />
					</StaggeredSection>
				)}
				<StaggeredSection>
					<StaggerList>
						<QuickActions />
					</StaggerList>
				</StaggeredSection>
			</section>

			{isAnonymous && (
				<StaggeredSection>
					<AnonymousUpsell />
				</StaggeredSection>
			)}
		</StaggerProvider>
	);
}
