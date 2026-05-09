import { useState } from "react";
import { StreakFire } from "@/components/celebration";
import {
	ProgressChart,
	StatsCards,
	SubjectsDrawer,
} from "@/components/dashboard";
import {
	Achievements,
	DailyChallenges,
	ProgressMilestones,
	StreakCelebration,
} from "@/components/gamification";
import { QuizEngine } from "@/components/quiz/quiz-engine";
import { useUserProgress, useUserSubjects } from "@/hooks";
import { useGamification } from "@/hooks/use-gamification";
import { toggleUserSubject } from "@/lib/server/actions";

const DEFAULT_USER_ID = "demo-user";

export default function StatsTab() {
	const [userId] = useState(DEFAULT_USER_ID);

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
						subjectIds={selectedSubjects}
						userId={userId}
						onComplete={() => {}}
					/>
				</div>
			)}
		</div>
	);
}
