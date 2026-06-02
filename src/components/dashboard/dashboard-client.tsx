"use client";

import { AnimatePresence, m } from "framer-motion";
import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { GamificationCelebration } from "@/components/celebration";
import type { BoltResult } from "@/components/dashboard/daily-bolt-overlay";
import { DailyBoltOverlay } from "@/components/dashboard/daily-bolt-overlay";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { TabNav } from "@/components/dashboard/navigation/tab-nav";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { SearchWidget } from "@/components/dashboard/search/search-widget";
import type { TabValue } from "@/components/dashboard/types";
import type { QuizResults } from "@/components/quiz/quiz-view";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { toast } from "@/hooks/use-toast";
import { useViewTransition } from "@/hooks/use-view-transition";
import { useWrongAnswerJournal } from "@/hooks/use-wrong-answer-journal";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { trackQuestionResult } from "@/lib/orchestrator";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { iOSEase } from "@/lib/utils/animation";
import { markPlanStale } from "@/lib/utils/study-planner";

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
	const [sprintMode, setSprintMode] = useState(false);
	const {
		isLoaded,
		gamification,
		addXp,
		updateStreak,
		checkAndUnlockAchievements,
		checkForRewardChests,
		currentStreak,
		levelInfo,
		totalQuestionsAnswered,
	} = useGamification();

	const todayStr = useMemo(() => new Date().toDateString(), []);
	const boltDue = gamification.lastPracticeDate !== todayStr;
	const [showDailyBolt, setShowDailyBolt] = useState(boltDue);
	const { addWrongAnswer } = useWrongAnswerJournal();
	const { startViewTransition } = useViewTransition();

	const handleStartQuiz = (subject: string) => {
		startViewTransition(() => {
			setQuizSubject(subject);
			setQuizActive(true);
		});
	};

	const handleBoltComplete = useCallback(
		(result: BoltResult) => {
			updateStreak();
			const accuracy = result.correct ? 100 : 0;
			addXp(1, accuracy, currentStreak);
			trackQuestionResult({
				subjectId: result.question.subject,
				topicId: result.question.topic,
				bloomLevel: result.question.bloomTaxonomy,
				score: result.correct ? 1 : 0,
				maxScore: 1,
			});
			if (!result.correct) {
				addWrongAnswer({
					questionId: result.question.id,
					questionText: result.question.questionText,
					subject: result.question.subject,
					topic: result.question.topic,
					correctAnswer: result.question.explanation,
					userAnswer: "(see quiz history)",
					explanation: result.question.explanation,
				});
				flashcardEngine.create(
					result.question.questionText,
					result.question.explanation,
					result.question.subject,
					result.question.topic,
				);
			}
			enqueue("analytics-sync", {
				events: [
					{
						event: "grade",
						timestamp: Date.now(),
						subject: result.question.subject,
						questionType: result.question.type,
						success: result.correct,
						duration: 0,
					},
				],
			});
			setShowDailyBolt(false);
		},
		[updateStreak, addXp, currentStreak, addWrongAnswer],
	);

	const handleBoltSprint = useCallback(
		(result: BoltResult) => {
			handleBoltComplete(result);
			setQuizSubject(result.question.subject);
			setSprintMode(true);
			setQuizActive(true);
		},
		[handleBoltComplete],
	);

	const handleBoltSkip = useCallback(() => {
		setShowDailyBolt(false);
	}, []);

	async function handleFinishQuizLogic(results: QuizResults) {
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

		markPlanStale();

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
		}).catch((e) => {
			console.warn("Analytics event failed:", e);
			toast({ type: "error", message: "Failed to save session data" });
		});
	}

	const handleFinishQuiz = async (results: QuizResults) => {
		await handleFinishQuizLogic(results);
		setSprintMode(false);
		setQuizActive(false);
		setQuizSubject("");
	};

	const handleQuitQuiz = () => {
		setSprintMode(false);
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
				{showDailyBolt ? (
					<DailyBoltOverlay
						onComplete={handleBoltComplete}
						onSprint={handleBoltSprint}
						onSkip={handleBoltSkip}
					/>
				) : !isLoaded ? (
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
											questionCount={sprintMode ? 4 : undefined}
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
