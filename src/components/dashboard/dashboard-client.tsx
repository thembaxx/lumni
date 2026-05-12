"use client";

import { useState } from "react";
import {
	CountdownHeader,
	QuickActions,
	StatsCards,
	TodayFocusCard,
} from "@/components/dashboard";
import { XpLevelCard } from "@/components/gamification";
import { useGamification } from "@/hooks/use-gamification";
import StudyTopicCardExample from "../study/example";
import type { TabValue } from "./types";

export function DashboardClient({
	initialTab = "ai",
}: {
	initialTab?: TabValue;
}) {
	const [_activeTab] = useState<TabValue>(initialTab || "ai");
	const [_practiceOpen, setPracticeOpen] = useState(false);
	const { levelInfo, isLoaded, gamification, currentStreak } =
		useGamification();

	if (!isLoaded) {
		return (
			<div className="min-h-screen flex items-center justify-center px-4">
				<div className="w-full max-w-md space-y-3">
					<div className="h-24 rounded-[16px] bg-[--system-surface-secondary] animate-pulse" />
					<div className="grid grid-cols-3 gap-3">
						<div className="h-24 rounded-[16px] bg-[--system-surface-secondary] animate-pulse" />
						<div className="h-24 rounded-[16px] bg-[--system-surface-secondary] animate-pulse" />
						<div className="h-24 rounded-[16px] bg-[--system-surface-secondary] animate-pulse" />
					</div>
					<div className="h-32 rounded-[16px] bg-[--system-surface-secondary] animate-pulse" />
					<div className="h-20 rounded-[16px] bg-[--system-surface-secondary] animate-pulse" />
				</div>
			</div>
		);
	}

	const stats = {
		streak: currentStreak,
		questionsAnswered:
			gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
		accuracy: 0,
	};

	return (
		<div className="min-h-screen flex flex-col bg-[--system-grouped-background] pt-4 pb-[69px] overflow-hidden w-full">
			<div className="max-w-md mx-auto w-full">
				<CountdownHeader />

				<div className="mb-3 px-4">
					<StatsCards
						streak={stats.streak}
						questionsAnswered={stats.questionsAnswered}
						accuracy={stats.accuracy}
					/>
				</div>

				<div className="mb-4 rounded-[16px] p-4 mx-4 bg-[--system-surface] shadow-[--shadow-level-1]">
					<XpLevelCard levelInfo={levelInfo} totalXp={gamification.totalXp} />
				</div>

				<div className="mb-4 px-4">
					<TodayFocusCard />
				</div>

				<div className="mb-6 px-4">
					<StudyTopicCardExample />
				</div>

				<div className="space-y-4 w-full px-4 overflow-x-auto scrollbar-hide">
					<QuickActions onPracticeClick={() => setPracticeOpen(true)} />
				</div>
			</div>
		</div>
	);
}
