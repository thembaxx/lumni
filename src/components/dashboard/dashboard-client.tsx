"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
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
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { StaggerList } from "@/components/shared/stagger-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
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
			<div className="flex items-center justify-center min-h-[60dvh]">
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
			<div className="h-64 flex items-center justify-center bg-system-surface rounded-[2rem] border border-dashed">
				<Skeleton className="h-full w-full rounded-[2rem]" />
			</div>
		),
	},
);

function SectionReveal({
	children,
	className,
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}) {
	const { ref, hasRevealed } = useScrollReveal<HTMLDivElement>({ once: true });
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
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
		</motion.div>
	);
}

function HeroBanner() {
	const shouldReduceMotion = useReducedMotion();
	const { shouldReduceMotion: shouldReduceMotionOpt } = useOptimizedAnimation();
	const finalShouldReduceMotion = shouldReduceMotion || shouldReduceMotionOpt;

	return (
		<motion.div
			className="relative -mx-4 mt-4 mb-6 h-40 overflow-hidden rounded-[2.5rem] bg-linear-to-br from-[--system-accent]/10 via-[--system-accent]/5 to-transparent shadow-[0_24px_48px_-16px_rgba(0,0,0,0.06)]"
			initial={{ opacity: 0, y: -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: iOSEase }}
			aria-label="Dashboard header showing welcome message"
			role="banner"
		>
			{!finalShouldReduceMotion && (
				<PerpetualFloat
					className="absolute right-8 top-1/2 -translate-y-1/2"
					duration={8}
					offsetY={-16}
					aria-hidden="true"
				>
					<div className="size-20 rounded-2xl bg-[--system-accent]/10 blur-xl" />
				</PerpetualFloat>
			)}

			<div className="relative p-8 flex flex-col justify-center h-full max-w-3xl">
				<motion.h1
					className="ios-title-1 font-extrabold text-foreground leading-tight tracking-tight max-w-lg"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.1, ease: iOSEase }}
				>
					Your Learning Dashboard
				</motion.h1>
				<motion.p
					className="text-sm text-muted-foreground mt-2 max-w-md"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2, ease: iOSEase }}
				>
					Continue where you left off. Track progress, practice, and master your
					subjects.
				</motion.p>
			</div>
		</motion.div>
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
					<Card className="h-full rounded-[2rem] shadow-level-1 p-4 flex items-center justify-center">
						<DailyProgressRing />
					</Card>
				</SectionReveal>
			</div>
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
			className="min-h-dvh flex flex-col bg-system-grouped pt-8 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))] overflow-x-hidden overflow-y-auto w-full"
		>
			<div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-8 pb-16">
				{activeTab === "today" && <HeroBanner />}
				{activeTab === "today" && <CountdownHeader />}
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
				{showAnalytics && (
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
				{showPractice && (
					<SectionReveal delay={0.1}>
						<TodayFocusCard />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.11}>
						<StreakCard />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.115}>
						<StudyPlanOverview />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.12}>
						<CompetencyOverview />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.13}>
						<DailyChallenges />
					</SectionReveal>
				)}
				{showPractice && (
					<SectionReveal delay={0.14}>
						<QuizStartCard onStart={onStartQuiz} />
					</SectionReveal>
				)}
				{showAnalytics && (
					<SectionReveal delay={0.14}>
						<ComparativeAnalyticsPanel />
					</SectionReveal>
				)}
				{showAnalytics && (
					<SectionReveal delay={0.16}>
						<StatsRow />
					</SectionReveal>
				)}
				{showAnalytics && (
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
				await createFlashcard(
					question.questionText,
					question.explanation,
					question.subject,
					question.topic,
				);
			}
		}

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
		}).catch(() => {});

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
			<div className="flex flex-col h-full">
				{!isLoaded ? (
					<motion.div
						key="loading"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0, transition: { duration: 0.15 } }}
						transition={{ duration: 0.2, ease: iOSEase }}
						className="min-h-dvh flex items-center justify-center px-4"
					>
						<div className="w-full max-w-md flex flex-col gap-3">
							<Skeleton className="h-24 rounded-[2rem]" />
							<div className="grid grid-cols-12 gap-3">
								<Skeleton className="col-span-8 h-24 rounded-[2rem]" />
								<Skeleton className="col-span-4 h-24 rounded-[2rem]" />
							</div>
							<Skeleton className="h-32 rounded-[2rem]" />
							<Skeleton className="h-20 rounded-[2rem]" />
						</div>
					</motion.div>
				) : (
					<>
						<div className="px-4 pt-2 pb-4">
							<SearchWidget />
							<TabNav activeTab={activeTab} onTabChange={handleTabChange} />
						</div>

						<div className="flex-1">
							<AnimatePresence initial={false} mode="wait">
								{quizActive ? (
									<motion.div
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
									</motion.div>
								) : (
									<motion.div
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
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					</>
				)}
			</div>
		</AppErrorBoundary>
	);
}
