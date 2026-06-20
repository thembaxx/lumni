"use client";

import { AnimatePresence, m } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import type { BoltResult } from "@/components/dashboard/daily-challenge-dialog";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { TabNav } from "@/components/dashboard/navigation/tab-nav";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import type { TabValue } from "@/components/dashboard/types";
import type { QuizResults } from "@/components/quiz/quiz-view";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { trackQuestionResult } from "@/lib/orchestrator/track-result";
import {
	processQuizResult,
	type QuizResultDeps,
} from "@/lib/services/quiz-result-processor";
import { iOSEase } from "@/lib/utils/animation";
import { addStudySession, markPlanStale } from "@/lib/utils/study-planner";

const QuizView = dynamic(
	() => import("@/components/quiz/quiz-view").then((m) => m.QuizView),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-dvh items-center justify-center">
				<Skeleton className="size-full max-w-3xl rounded-3xl" />
			</div>
		),
	},
);

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
		checkForRewardChests,
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

	const quizResultDeps: QuizResultDeps = useMemo(
		() => ({
			updateStreak,
			addXp,
			checkAndUnlockAchievements,
			checkForRewardChests,
			addWrongAnswer,
			flashcardEngine,
			trackQuestionResult,
			enqueue,
			addStudySession,
			markPlanStale,
			currentStreak,
			totalQuestionsAnswered,
			levelInfo,
		}),
		[
			updateStreak,
			addXp,
			checkAndUnlockAchievements,
			checkForRewardChests,
			addWrongAnswer,
			currentStreak,
			totalQuestionsAnswered,
			levelInfo,
		],
	);

	const handleBoltComplete = useCallback(
		async (result: BoltResult) => {
			await processQuizResult(
				{ source: "bolt", question: result },
				quizResultDeps,
			);
		},
		[quizResultDeps],
	);

	const handleFinishQuiz = async (results: QuizResults) => {
		await processQuizResult({ source: "quiz", results }, quizResultDeps);
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
			<a
				href="#dashboard-content"
				className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-skip-link focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg focus:outline-none"
			>
				Skip to content
			</a>
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
							<Skeleton className="h-24 rounded-3xl" />
							<div className="grid grid-cols-12 gap-3">
								<Skeleton className="col-span-8 h-24 rounded-3xl" />
								<Skeleton className="col-span-4 h-24 rounded-3xl" />
							</div>
							<Skeleton className="h-32 rounded-3xl" />
							<Skeleton className="h-20 rounded-3xl" />
						</div>
					</m.div>
				) : (
					<>
						<div className="px-4 pt-2 pb-4">
							<SearchWidget />
							<TabNav activeTab={activeTab} onTabChange={handleTabChange} />
						</div>

						<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
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
										className="flex min-h-0 flex-1 flex-col"
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
											id="dashboard-content"
											onStartQuiz={handleStartQuiz}
											activeTab={activeTab}
											onBoltComplete={handleBoltComplete}
											boltStreak={currentStreak}
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
