"use client";

import { AnimatePresence, m } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
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
import { trackQuestionResult } from "@/lib/orchestrator";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { iOSEase } from "@/lib/utils/animation";

const QuizView = dynamic(
	() => import("@/components/quiz/quiz-view").then((m) => m.QuizView),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-[60dvh] items-center justify-center">
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
		checkForRewardChests();

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
					flashcardEngine.create(
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
