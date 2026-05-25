"use client";

import { StreakFire } from "@/components/celebration";
import { ProgressChart } from "@/components/dashboard/progress-chart";
import { Achievements } from "@/components/gamification";
import { Card, CardContent } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { useUserProgress } from "@/hooks/use-user-progress";
import { useAuth } from "@/lib/auth/auth-context";

export function StatsRow() {
	const { user } = useAuth();
	const userId = user?.$id ?? "";
	const {
		gamification,
		currentStreak,
		isLoaded: isGamificationLoaded,
	} = useGamification();
	const { data: progressData, isLoading: isProgressLoading } =
		useUserProgress(userId);

	if (!isGamificationLoaded || isProgressLoading) return null;

	const chartData = [
		{ date: "Mon", accuracy: 65 },
		{ date: "Tue", accuracy: 70 },
		{ date: "Wed", accuracy: 60 },
		{ date: "Thu", accuracy: 80 },
		{ date: "Fri", accuracy: 75 },
		{ date: "Sat", accuracy: 85 },
		{ date: "Sun", accuracy: progressData?.accuracy || 0 },
	];

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<Card className="overflow-hidden rounded-xl">
				<CardContent className="flex flex-col gap-4 p-5">
					<StreakFire streak={currentStreak} showMilestone />
					<Achievements achievements={gamification.achievements} />
				</CardContent>
			</Card>
			<ProgressChart data={chartData} title="This Week's Progress" />
		</div>
	);
}
