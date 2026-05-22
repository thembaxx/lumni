"use client";

import { Login01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import { AchievementShowcase } from "@/components/dashboard/achievement-showcase";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { DailyChallenges } from "@/components/dashboard/daily-challenges";
import { TabNav } from "@/components/dashboard/navigation/tab-nav";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { QuizStartCard } from "@/components/dashboard/quiz-start-card";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatsRow } from "@/components/dashboard/stats-row";
import { StreakCard } from "@/components/dashboard/streak-card";
import { StudyPlanOverview } from "@/components/dashboard/study-plan-overview";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import type { TabValue } from "@/components/dashboard/types";
import { GettingStartedCard } from "@/components/onboarding/getting-started-card";
import { NotificationNudge } from "@/components/onboarding/notification-nudge";
import type { QuizResults } from "@/components/quiz/quiz-view";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { EmptyStateWithIllustration } from "@/components/shared/empty-state";
import { LocalDataNotice } from "@/components/shared/local-data-notice";
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { StaggerList } from "@/components/shared/stagger-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { useAuth } from "@/lib/auth/auth-context";
import { trackQuestionResult } from "@/lib/competency-engine";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { iOSEase } from "@/lib/utils/animation";
import { useOptimizedAnimation } from "@/lib/utils/animation-optimization";
import { createFlashcard } from "@/lib/utils/spaced-repetition";

const QuizView = dynamic(
	() => import("@/components/quiz/quiz-view").then((m) => m.QuizView),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-[60dvh] items-center justify-center">
				<Skeleton className="size-full max-w-3xl rounded-[2rem]" />
			</div>
		),
	},
);

const CompetencyOverview = dynamic(
	() =>
		import("@/components/dashboard/competency-overview").then(
			(m) => m.CompetencyOverview,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-[2rem]" /> },
);

const BloomTaxonomyWidget = dynamic(
	() =>
		import("@/components/dashboard/bloom-taxonomy-widget").then(
			(m) => m.BloomTaxonomyWidget,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-48 rounded-[2rem]" />,
	},
);

const DailyProgressRing = dynamic(
	() =>
		import("@/components/dashboard/daily-progress-ring").then(
			(m) => m.DailyProgressRing,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="size-full rounded-[2rem]" />,
	},
);

const FocusTimerCard = dynamic(
	() =>
		import("@/components/dashboard/focus-timer-card").then(
			(m) => m.FocusTimerCard,
		),
	{ ssr: false, loading: () => <Skeleton className="h-20 rounded-[2rem]" /> },
);

const ComparativeAnalyticsPanel = dynamic(
	() =>
		import("@/components/dashboard/analytics/comparative-analytics-panel").then(
			(mod) => mod.ComparativeAnalyticsPanel,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-64 items-center justify-center rounded-[2rem] border border-dashed bg-system-surface">
				<Skeleton className="h-full w-full rounded-[2rem]" />
			</div>
		),
	},
);

function SectionReveal({
	children,
	className: _className,
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}) {
	const { ref, hasRevealed } = useScrollReveal<HTMLDivElement>({ once: true });
	const shouldReduceMotion = useReducedMotion();

	return (
		<m.div
			ref={ref}
			initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
			animate={{
				opacity: shouldReduceMotion || hasRevealed ? 1 : 0,
				y: shouldReduceMotion || hasRevealed ? 0 : 16,
			}}
			transition={{
				duration: 0.4,
				ease: iOSEase,
				delay: shouldReduceMotion ? 0 : delay,
			}}
		>
			{children}
		</m.div>
	);
}

function HeroBanner() {
	const shouldReduceMotion = useReducedMotion();
	const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
	const finalShouldReduceMotion = shouldReduceMotion || shouldReduceMotionOpt;

	return (
		<m.div
			className="relative -mx-4 mt-4 mb-6 h-40 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-[--system-accent]/10 via-[--system-accent]/5 to-transparent shadow-[0_24px_48px_-16px_rgba(0,0,0,0.06)]"
			initial={{ opacity: 0, y: -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: iOSEase }}
			aria-label="Dashboard header showing welcome message"
			role="banner"
		>
			{!finalShouldReduceMotion && (
				<PerpetualFloat
					className="absolute top-1/2 right-8 -translate-y-1/2"
					duration={8}
					offsetY={-16}
					aria-hidden="true"
				>
					<div className="size-20 rounded-2xl bg-[--system-accent]/10 blur-xl" />
				</PerpetualFloat>
			)}

			<div className="relative flex h-full max-w-3xl flex-col justify-center p-8">
				<m.h1
					className="ios-title-1 max-w-lg font-semibold text-foreground leading-tight tracking-tight"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.1, ease: iOSEase }}
				>
					Your Learning Dashboard
				</m.h1>
				<m.p
					className="mt-2 max-w-md text-muted-foreground text-sm"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2, ease: iOSEase }}
				>
					Continue where you left off. Track progress, practice, and master your
					subjects.
				</m.p>
			</div>
		</m.div>
	);
}

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
					<Card className="flex h-full items-center justify-center rounded-[2rem] p-4 shadow-level-1">
						<DailyProgressRing />
					</Card>
				</SectionReveal>
			</div>
		</div>
	);
}

function AnonymousUpsell() {
	return (
		<div className="rounded-[2rem] border border-dashed bg-system-surface p-8 shadow-level-1">
			<EmptyStateWithIllustration
				icon={Login01Icon}
				title="Sign in to track your progress"
				description="Create an account or sign in to save your study history, track your XP and streaks, unlock achievements, and compare your performance across subjects."
				action={{
					label: "Sign In",
					onClick: () => {
						window.location.href = "/auth/sign-in?redirect=/dashboard";
					},
				}}
				secondaryAction={{
					label: "Create Account",
					onClick: () => {
						window.location.href = "/auth/sign-up?redirect=/dashboard";
					},
				}}
			/>
		</div>
	);
}

function DashboardContent({
	onStartQuiz,
	activeTab,
}: {
	onStartQuiz: (subject: string) => void;
	activeTab: TabValue;
}) {
	const { isAnonymous } = useAuth();
	const { gamification } = useGamification();

	const stats = {
		questionsAnswered:
			gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
		accuracy: 0,
	};

	const showPractice = activeTab === "today" || activeTab === "spaces";
	const showAnalytics = activeTab === "today" || activeTab === "analytics";

	return (
		<div
			data-scroll-container
			className="flex min-h-dvh w-full flex-col overflow-y-auto overflow-x-hidden bg-system-grouped pt-8 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))]"
		>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 pb-16">
				{activeTab === "today" && <HeroBanner />}
				{isAnonymous && (
					<LocalDataNotice
						page="dashboard"
						description="Your progress, XP, and streaks are stored on this device. Sign in to keep them across all your devices."
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
					<SectionReveal delay={0.18}>
						<AchievementShowcase />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.19}>
						<StaggerList>
							<QuickActions />
						</StaggerList>
					</SectionReveal>
				)}
			</div>
		</div>
	);
}

export function DashboardClient({
	initialTab = "today",
}: {
	initialTab?: string;
}) {
	const [quizActive, setQuizActive] = useState(false);
	const [quizSubject, setQuizSubject] = useState("");
	const [activeTab, setActiveTab] = useState<TabValue>(initialTab as TabValue);
	const {
		isLoaded,
		addXp,
		updateStreak,
		checkAndUnlockAchievements,
		currentStreak,
		levelInfo,
		totalQuestionsAnswered,
	} = useGamification();
	const { addWrongAnswer } = useWrongAnswerJournal();
	const { startViewTransition } = useViewTransition();

	const handleStartQuiz = (subject: string) => {
		startViewTransition(() => {
			setQuizSubject(subject);
			setQuizActive(true);
		});
	};

	const handleFinishQuiz = async (results: QuizResults) => {
		updateStreak();
		const accuracy =
			results.totalQuestions > 0
				? Math.round((results.correctAnswers / results.totalQuestions) * 100)
				: 0;
		addXp(results.totalQuestions, accuracy, currentStreak);
		checkAndUnlockAchievements(
			totalQuestionsAnswered + results.totalQuestions,
			accuracy,
			currentStreak,
			levelInfo.level,
			accuracy === 100,
		);

		const flashcardPromises: Promise<unknown>[] = [];

		for (const [i, question] of results.questions.entries()) {
			const correct = results.correctness[i] ?? false;
			trackQuestionResult({
				subjectId: question.subject,
				topicId: question.topic,
				bloomLevel: question.bloomTaxonomy,
				score: correct ? 1 : 0,
				maxScore: 1,
			});

			if (!correct) {
				addWrongAnswer({
					questionId: question.id,
					questionText: question.questionText,
					subject: question.subject,
					topic: question.topic,
					correctAnswer: question.explanation,
					userAnswer: "(see quiz history)",
					explanation: question.explanation,
				});
				flashcardPromises.push(
					createFlashcard(
						question.questionText,
						question.explanation,
						question.subject,
						question.topic,
					),
				);
			}
		}

		await Promise.all(flashcardPromises);

		enqueue("analytics-sync", {
			events: results.questions.map((q, i) => ({
				event: "grade",
				timestamp: Date.now(),
				subject: q.subject,
				questionType: q.type,
				success: results.correctness[i] ?? false,
				duration: 0,
			})),
		});

		fetch("/api/study-sessions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				subject: results.questions[0]?.subject ?? "unknown",
				questionsAnswered: results.totalQuestions,
				correctCount: results.correctAnswers,
				duration: results.elapsedTime,
			}),
		}).catch((e) => console.warn("Analytics event failed:", e));

		setQuizActive(false);
		setQuizSubject("");
	};

	const handleQuitQuiz = () => {
		setQuizActive(false);
		setQuizSubject("");
	};

	const handleTabChange = (tab: TabValue) => {
		setActiveTab(tab);
	};

	return (
		<AppErrorBoundary>
			<ScrollAmbient />
			<div className="flex h-full flex-col">
				{!isLoaded ? (
					<m.div
						key="loading"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0, transition: { duration: 0.15 } }}
						transition={{ duration: 0.2, ease: iOSEase }}
						className="flex min-h-dvh items-center justify-center px-4"
					>
						<div className="flex w-full max-w-md flex-col gap-3">
							<Skeleton className="h-24 rounded-[2rem]" />
							<div className="grid grid-cols-12 gap-3">
								<Skeleton className="col-span-8 h-24 rounded-[2rem]" />
								<Skeleton className="col-span-4 h-24 rounded-[2rem]" />
							</div>
							<Skeleton className="h-32 rounded-[2rem]" />
							<Skeleton className="h-20 rounded-[2rem]" />
						</div>
					</m.div>
				) : (
					<>
						<div className="px-4 pt-2 pb-4">
							<SearchWidget />
							<TabNav activeTab={activeTab} onTabChange={handleTabChange} />
						</div>

						<div className="flex-1">
							<AnimatePresence initial={false} mode="wait">
								{quizActive ? (
									<m.div
										key="quiz"
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: -8 }}
										transition={{ duration: 0.25, ease: iOSEase }}
									>
										<QuizView
											initialSubject={quizSubject}
											variant="full"
											onQuit={handleQuitQuiz}
											onFinish={handleFinishQuiz}
										/>
									</m.div>
								) : (
									<m.div
										key={activeTab}
										initial={{ opacity: 0, y: 4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{
											opacity: 0,
											y: -4,
											transition: { duration: 0.15, ease: iOSEase },
										}}
										transition={{ duration: 0.25, ease: iOSEase }}
									>
										<DashboardContent
											onStartQuiz={handleStartQuiz}
											activeTab={activeTab}
										/>
									</m.div>
								)}
							</AnimatePresence>
						</div>
					</>
				)}
			</div>
			<GamificationCelebration />
		</AppErrorBoundary>
	);
}
