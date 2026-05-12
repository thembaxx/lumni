"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { XpLevelCard } from "@/components/gamification";
import { useGamification } from "@/hooks/use-gamification";
import { iOSEase } from "@/lib/utils/animation";
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
	const shouldReduceMotion = useReducedMotion();

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

	const sectionProps = (delay: number) => ({
		initial: { opacity: 0, y: 12 },
		animate: { opacity: 1, y: 0 },
		transition: {
			duration: shouldReduceMotion ? 0 : 0.4,
			ease: iOSEase,
			delay: shouldReduceMotion ? 0 : delay,
		},
	});

	return (
		<div className="min-h-screen flex flex-col bg-[--system-grouped-background] pt-[--space-4] pb-[calc(var(--space-16)+var(--space-5))] overflow-hidden w-full">
			<div className="max-w-md mx-auto w-full">
				<CountdownHeader />

				<motion.div
					{...sectionProps(0.1)}
					className="mb-[--space-4] px-[--space-4]"
				>
					<StatsCards
						streak={stats.streak}
						questionsAnswered={stats.questionsAnswered}
						accuracy={stats.accuracy}
					/>
				</motion.div>

				<motion.div
					{...sectionProps(0.15)}
					className="mb-[--space-4] mx-[--space-4]"
				>
					<div className="rounded-[--radius-card] p-[--space-4] bg-[--system-surface] shadow-[--shadow-level-1]">
						<XpLevelCard levelInfo={levelInfo} totalXp={gamification.totalXp} />
					</div>
				</motion.div>

				<motion.div
					{...sectionProps(0.2)}
					className="mb-[--space-4] px-[--space-4]"
				>
					<TodayFocusCard />
				</motion.div>

				<motion.div
					{...sectionProps(0.25)}
					className="mb-[--space-6] px-[--space-4]"
				>
					<StudyTopicCardExample />
				</motion.div>

				<motion.div
					{...sectionProps(0.3)}
					className="space-y-[--space-4] w-full px-[--space-4] overflow-x-auto scrollbar-hide"
				>
					<QuickActions onPracticeClick={() => setPracticeOpen(true)} />
				</motion.div>
			</div>
		</div>
	);
}
