"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { DailyProgressRing } from "@/components/dashboard/daily-progress-ring";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { useGamification } from "@/hooks/use-gamification";
import { iOSEase } from "@/lib/utils/animation";
import type { TabValue } from "./types";

export function DashboardClient({
	initialTab = "ai",
}: {
	initialTab?: TabValue;
}) {
	const [_activeTab] = useState<TabValue>(initialTab || "ai");
	const [_practiceOpen, setPracticeOpen] = useState(false);
	const { isLoaded, gamification } = useGamification();
	const shouldReduceMotion = useReducedMotion();

	const stats = {
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
		<AnimatePresence mode="wait">
			{!isLoaded ? (
				<motion.div
					key="loading"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0, transition: { duration: 0.15 } }}
					transition={{ duration: 0.2, ease: iOSEase }}
					className="min-h-screen flex items-center justify-center px-4"
				>
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
				</motion.div>
			) : (
				<motion.div
					key="content"
					initial={{ opacity: 0, y: 4 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.25, ease: iOSEase }}
					className="min-h-screen flex flex-col bg-system-grouped pt-4 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))] overflow-x-hidden w-full"
				>
					<div className="max-w-md mx-auto w-full px-4 space-y-6">
						<CountdownHeader />

						<motion.div {...sectionProps(0.1)}>
							<DailyProgressRing />
						</motion.div>

						<motion.div {...sectionProps(0.15)}>
							<StatsCards
								questionsAnswered={stats.questionsAnswered}
								accuracy={stats.accuracy}
							/>
						</motion.div>

						<motion.div {...sectionProps(0.2)}>
							<TodayFocusCard />
						</motion.div>

						<motion.div
							{...sectionProps(0.25)}
							className="w-full overflow-x-auto scrollbar-hide"
						>
							<QuickActions onPracticeClick={() => setPracticeOpen(true)} />
						</motion.div>
					</div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
