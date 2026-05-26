import { Timer01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { StreakFire } from "@/components/celebration";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ProgressChart = dynamic(
	() =>
		import("@/components/dashboard/progress-chart").then(
			(m) => m.ProgressChart,
		),
	{
		ssr: false,
		loading: () => <Skeleton className="h-[250px] rounded-lg" />,
	},
);

import {
	Achievements,
	DailyChallenges,
	ProgressMilestones,
	StreakCelebration,
} from "@/components/gamification";
import { QuizEngine, type QuizResults } from "@/components/quiz/quiz-engine";
import { useGamification } from "@/hooks/use-gamification";
import { useUserProgress } from "@/hooks/use-user-progress";
import { useUserSubjects } from "@/hooks/use-user-subjects";
import { useAuth } from "@/lib/auth";
import { toggleUserSubject } from "@/lib/server";

export default function StatsTab() {
	const { user, authReady } = useAuth();
	const userId = user?.$id ?? null;
	const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

	const { data: progressData, isLoading: isProgressLoading } = useUserProgress(
		userId ?? "",
	);
	const { data: subjectsResult, isLoading: isSubjectsLoading } =
		useUserSubjects(userId ?? "");
	const {
		gamification,
		currentStreak,
		isLoaded: isGamificationLoaded,
	} = useGamification();

	const selectedSubjects = subjectsResult?.selectedSubjectIds ?? [];
	const progress = progressData ?? {
		streak: 0,
		questionsAnswered: 0,
		accuracy: 0,
	};

	async function handleSubjectToggle(newSelection: string[]) {
		if (!userId) return;
		const added = newSelection.find((id) => !selectedSubjects.includes(id));
		const removed = selectedSubjects.find((id) => !newSelection.includes(id));

		if (added) {
			await toggleUserSubject(userId, added);
		} else if (removed) {
			await toggleUserSubject(userId, removed);
		}
	}

	const handleQuizComplete = useCallback((results: QuizResults) => {
		setQuizResults(results);
	}, []);

	const handleQuizRestart = useCallback(() => {
		setQuizResults(null);
	}, []);

	const chartData = [
		{ date: "Mon", accuracy: 65 },
		{ date: "Tue", accuracy: 70 },
		{ date: "Wed", accuracy: 60 },
		{ date: "Thu", accuracy: 80 },
		{ date: "Fri", accuracy: 75 },
		{ date: "Sat", accuracy: 85 },
		{ date: "Sun", accuracy: progress.accuracy || 0 },
	];

	if (
		!authReady ||
		isProgressLoading ||
		isSubjectsLoading ||
		!isGamificationLoaded
	) {
		return (
			<div className="flex flex-col gap-3 px-4 pb-6">
				<Skeleton className="h-24 rounded-lg" />
				<Skeleton className="h-24 rounded-lg" />
				<Skeleton className="h-48 rounded-lg" />
			</div>
		);
	}

	if (!userId) {
		return (
			<div className="flex flex-col gap-3 px-4 pb-6">
				<Card className="border-0 p-6">
					<p className="text-muted-foreground">
						Sign in to track your practice progress and streaks.
					</p>
				</Card>
			</div>
		);
	}

	if (quizResults) {
		const isGreatScore = quizResults.accuracy >= 80;
		const isPerfect = quizResults.accuracy === 100;

		return (
			<div className="flex flex-col gap-3 px-4 pb-6">
				<SubjectsDrawer
					userId={userId}
					selectedSubjects={selectedSubjects}
					onSelectionChange={handleSubjectToggle}
				/>
				<StreakFire streak={currentStreak} showMilestone />

				<Card className="overflow-visible border-0">
					{isPerfect && (
						<div className="-mt-2 flex items-center justify-center">
							<div className="flex items-center gap-2 rounded-full bg-warning px-4 py-1.5 text-warning-foreground shadow-lg">
								<span className="font-extrabold text-sm">Perfect Score!</span>
							</div>
						</div>
					)}
					<CardHeader className="p-6 pb-2 md:text-left">
						<h3 className="font-semibold text-xl tracking-tight">
							{isPerfect
								? "Flawless!"
								: isGreatScore
									? "Great Job!"
									: "Quiz Complete!"}
						</h3>
						<p className="mt-1 text-muted-foreground text-sm">
							Here are your results:
						</p>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 px-6 pb-6">
						<div className="grid grid-cols-12 gap-3 md:text-left">
							<div className="col-span-5 rounded-lg bg-muted p-3">
								<p className="font-extrabold text-xl tabular-nums">
									{quizResults.totalQuestions}
								</p>
								<p className="text-muted-foreground text-xs">Questions</p>
							</div>
							<div className="col-span-3 rounded-lg bg-muted p-3">
								<p
									className={
										"font-extrabold text-xl tabular-nums" +
										(isGreatScore ? "text-success" : "")
									}
								>
									{quizResults.correctAnswers}
								</p>
								<p className="text-muted-foreground text-xs">Correct</p>
							</div>
							<div className="col-span-4 rounded-lg bg-muted p-3">
								<p
									className={
										"font-extrabold text-xl tabular-nums" +
										(isGreatScore ? "text-success" : "")
									}
								>
									{quizResults.accuracy}%
								</p>
								<p className="text-muted-foreground text-xs">Accuracy</p>
							</div>
						</div>

						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<HugeiconsIcon icon={Timer01Icon} className="size-4" />
							<span className="text-sm">
								{Math.floor(quizResults.elapsedTime / 60)}m{" "}
								{quizResults.elapsedTime % 60}s
							</span>
						</div>
					</CardContent>
				</Card>

				{quizResults.incorrectAnswers.length > 0 && (
					<Card className="overflow-hidden border-0">
						<CardHeader className="p-4 pb-2">
							<h3 className="font-semibold text-base tracking-tight">
								Review Mistakes
							</h3>
						</CardHeader>
						<CardContent className="flex flex-col gap-2 p-4">
							{quizResults.incorrectAnswers.slice(0, 3).map((item, idx) => (
								<div
									key={item.questionId || idx}
									className="flex gap-2 text-sm"
								>
									<span className="text-muted-foreground">{idx + 1}.</span>
									<span className="text-destructive">
										{item.selectedAnswer}
									</span>
									<span className="text-muted-foreground">→</span>
									<span className="text-success">{item.correctAnswer}</span>
								</div>
							))}
						</CardContent>
					</Card>
				)}

				<Button className="w-full" onClick={handleQuizRestart}>
					Try Another Quiz
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-3 px-4 pb-6">
			<SubjectsDrawer
				userId={userId}
				selectedSubjects={selectedSubjects}
				onSelectionChange={handleSubjectToggle}
			/>
			<StreakFire streak={currentStreak} showMilestone />
			<StreakCelebration
				currentStreak={currentStreak}
				milestones={gamification.streakMilestones}
			/>
			<DailyChallenges challenges={gamification.dailyChallenges} />
			<Achievements achievements={gamification.achievements} />
			<ProgressMilestones
				currentStreak={currentStreak}
				milestones={gamification.streakMilestones}
			/>
			<StatsCards
				questionsAnswered={progress.questionsAnswered}
				accuracy={progress.accuracy}
			/>
			<ProgressChart data={chartData} title="This Week's Progress" />
			{selectedSubjects.length > 0 && (
				<div className="pt-4">
					<QuizEngine
						subjectId={selectedSubjects[0]}
						onComplete={handleQuizComplete}
					/>
				</div>
			)}
		</div>
	);
}
