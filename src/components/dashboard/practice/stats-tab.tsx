import { Timer } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { StreakFire } from "@/components/celebration";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { StatsCards } from "@/components/dashboard/stats-cards";

const ProgressChart = dynamic(
	() =>
		import("@/components/dashboard/progress-chart").then(
			(m) => m.ProgressChart,
		),
	{
		ssr: false,
		loading: () => (
			<div className="h-[250px] rounded-lg bg-[--system-surface] animate-pulse" />
		),
	},
);

import {
	Achievements,
	DailyChallenges,
	ProgressMilestones,
	StreakCelebration,
} from "@/components/gamification";
import { QuizEngine, type QuizResults } from "@/components/quiz/quiz-engine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { useUserProgress } from "@/hooks/use-user-progress";
import { useUserSubjects } from "@/hooks/use-user-subjects";
import { toggleUserSubject } from "@/lib/server/actions";
import { cn } from "@/lib/utils";

const DEFAULT_USER_ID = "demo-user";

export default function StatsTab() {
	const [userId] = useState(DEFAULT_USER_ID);
	const [quizResults, setQuizResults] = useState<QuizResults | null>(null);

	const { data: progressData, isLoading: isProgressLoading } =
		useUserProgress(userId);
	const { data: subjectsResult, isLoading: isSubjectsLoading } =
		useUserSubjects(userId);
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
		const added = newSelection.find((id) => !selectedSubjects.includes(id));
		const removed = selectedSubjects.find((id) => !newSelection.includes(id));

		if (added) {
			await toggleUserSubject(DEFAULT_USER_ID, added);
		} else if (removed) {
			await toggleUserSubject(DEFAULT_USER_ID, removed);
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

	if (isProgressLoading || isSubjectsLoading || !isGamificationLoaded) {
		return (
			<div className="px-4 pb-6 space-y-3">
				<div className="animate-pulse h-24 bg-muted rounded-lg" />
				<div className="animate-pulse h-24 bg-muted rounded-lg" />
				<div className="animate-pulse h-48 bg-muted rounded-lg" />
			</div>
		);
	}

	if (quizResults) {
		const isGreatScore = quizResults.accuracy >= 80;
		const isPerfect = quizResults.accuracy === 100;

		return (
			<div className="px-4 pb-6 space-y-3">
				<SubjectsDrawer
					userId={userId}
					selectedSubjects={selectedSubjects}
					onSelectionChange={handleSubjectToggle}
				/>
				<StreakFire streak={currentStreak} showMilestone />

				<Card className="overflow-visible">
					{isPerfect && (
						<div className="flex items-center justify-center -mt-2">
							<div className="flex items-center gap-2 rounded-full bg-warning text-warning-foreground px-4 py-1.5 shadow-lg">
								<span className="text-sm font-bold">Perfect Score!</span>
							</div>
						</div>
					)}
					<CardHeader className="text-center pb-2">
						<CardTitle>
							{isPerfect
								? "Flawless!"
								: isGreatScore
									? "Great Job!"
									: "Quiz Complete!"}
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-3 gap-3 text-center">
							<div className="p-3 rounded-lg bg-muted">
								<p className="text-xl font-bold tabular-nums">
									{quizResults.totalQuestions}
								</p>
								<p className="text-xs text-muted-foreground">Questions</p>
							</div>
							<div className="p-3 rounded-lg bg-muted">
								<p
									className={cn(
										"text-xl font-bold tabular-nums",
										isGreatScore && "text-success",
									)}
								>
									{quizResults.correctAnswers}
								</p>
								<p className="text-xs text-muted-foreground">Correct</p>
							</div>
							<div className="p-3 rounded-lg bg-muted">
								<p
									className={cn(
										"text-xl font-bold tabular-nums",
										isGreatScore && "text-success",
									)}
								>
									{quizResults.accuracy}%
								</p>
								<p className="text-xs text-muted-foreground">Accuracy</p>
							</div>
						</div>

						<div className="flex items-center justify-center gap-2 text-muted-foreground">
							<Timer className="size-4" />
							<span className="text-sm">
								{Math.floor(quizResults.elapsedTime / 60)}m{" "}
								{quizResults.elapsedTime % 60}s
							</span>
						</div>
					</CardContent>
				</Card>

				{quizResults.incorrectAnswers.length > 0 && (
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">Review Mistakes</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
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
		<div className="px-4 pb-6 space-y-3">
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
				streak={progress.streak}
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
