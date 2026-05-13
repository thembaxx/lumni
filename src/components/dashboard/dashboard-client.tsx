"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { CountdownHeader } from "@/components/dashboard/countdown-header";
import { DailyProgressRing } from "@/components/dashboard/daily-progress-ring";
import { PracticeSheet } from "@/components/dashboard/practice/practice-sheet";
import { QuickActions } from "@/components/dashboard/quick-actions/quick-actions";
import { ScrollAmbient } from "@/components/dashboard/scroll-ambient";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { TodayFocusCard } from "@/components/dashboard/today-focus-card";
import { useGamification } from "@/hooks/use-gamification";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useViewTransition } from "@/hooks/use-view-transition";
import { iOSEase } from "@/lib/utils/animation";
import type { TabValue } from "./types";

function SectionReveal({
	children,
	className,
	delay = 0,
}: {
	children: React.ReactNode;
	className?: string;
	delay?: number;
}) {
	const { ref, hasRevealed } = useScrollReveal<HTMLDivElement>({ once: true });
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			ref={ref}
			initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
			animate={
				shouldReduceMotion || hasRevealed
					? { opacity: 1, y: 0 }
					: { opacity: 0, y: 16 }
			}
			transition={{
				duration: 0.4,
				ease: iOSEase,
				delay: shouldReduceMotion ? 0 : delay,
			}}
			className={className}
		>
			{children}
		</motion.div>
	);
}

export function DashboardClient({
	initialTab = "ai",
}: {
	initialTab?: TabValue;
}) {
	const [_activeTab] = useState<TabValue>(initialTab || "ai");
	const [practiceOpen, setPracticeOpen] = useState(false);
	const { isLoaded, gamification } = useGamification();
	const shouldReduceMotion = useReducedMotion();
	const { startViewTransition } = useViewTransition();

	const stats = {
		questionsAnswered:
			gamification.totalXp > 0 ? Math.floor(gamification.totalXp / 25) : 0,
		accuracy: 0,
	};

	function handlePracticeClick() {
		startViewTransition(() => setPracticeOpen(true));
	}

	return (
		<>
			<ScrollAmbient />
			<AnimatePresence initial={false} mode="wait">
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
						exit={{
							opacity: 0,
							y: -4,
							transition: { duration: 0.15, ease: iOSEase },
						}}
						transition={{ duration: 0.25, ease: iOSEase }}
						data-scroll-container
						className="min-h-screen flex flex-col bg-system-grouped pt-4 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))] overflow-x-hidden overflow-y-auto w-full"
					>
						<div className="max-w-md mx-auto w-full px-4 space-y-6">
							<CountdownHeader />

							<SectionReveal delay={0.05}>
								<DailyProgressRing />
							</SectionReveal>

							<SectionReveal delay={0.1}>
								<StatsCards
									questionsAnswered={stats.questionsAnswered}
									accuracy={stats.accuracy}
								/>
							</SectionReveal>

							<SectionReveal delay={0.15}>
								<TodayFocusCard />
							</SectionReveal>

							{practiceOpen ? null : (
								<SectionReveal
									delay={0.2}
									className="w-full overflow-x-auto scrollbar-hide"
								>
									<QuickActions onPracticeClick={handlePracticeClick} />
								</SectionReveal>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
			<PracticeSheet open={practiceOpen} onOpenChange={setPracticeOpen} />
		</>
	);
}
