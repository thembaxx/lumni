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
import { PerpetualFloat } from "@/components/shared/perpetual-float";
import { StaggerList } from "@/components/shared/stagger-list";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGamification } from "@/hooks/use-gamification";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { useViewTransition } from "@/hooks/use-view-transition";
import { cn } from "@/lib/utils";
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

// Anti-center bias: left-aligned hero, right-weighted visual block
function HeroBanner() {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			className="relative -mx-4 -mt-4 mb-6 h-40 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[--system-accent]/10 via-[--system-accent]/5 to-transparent shadow-[0_24px_48px_-16px_rgba(0,0,0,0.06)]"
			initial={{ opacity: 0, y: -12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, ease: iOSEase }}
		>
			{/* Decorative floating accent */}
			{!shouldReduceMotion && (
				<PerpetualFloat
					className="absolute right-8 top-1/2 -translate-y-1/2"
					duration={8}
					offsetY={-16}
				>
					<div className="size-20 rounded-2xl bg-[--system-accent]/10 blur-xl" />
				</PerpetualFloat>
			)}

			<div className="relative p-8 flex flex-col justify-center h-full max-w-3xl">
				<motion.h1
					className="ios-title-1 font-bold text-foreground leading-tight tracking-tight max-w-lg"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.1, ease: iOSEase }}
				>
					Your Learning Dashboard
				</motion.h1>
				<motion.p
					className="text-sm text-muted-foreground mt-2 max-w-md"
					initial={{ opacity: 0, x: -20 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.5, delay: 0.2, ease: iOSEase }}
				>
					Continue where you left off. Track progress, practice, and master your
					subjects.
				</motion.p>
			</div>
		</motion.div>
	);
}

// Bento 2.0 stat row: 2/3 stats + 1/3 progress ring
function BentoStatRow({
	questionsAnswered,
	accuracy,
}: {
	questionsAnswered: number;
	accuracy: number;
}) {
	return (
		<div className="grid grid-cols-12 gap-3">
			{/* Stats: spans 8 cols (2/3) desktop, full width mobile */}
			<div className="col-span-12 sm:col-span-8">
				<StatsCards questionsAnswered={questionsAnswered} accuracy={accuracy} />
			</div>
			{/* Progress Ring: spans 4 cols (1/3) desktop, full width mobile */}
			<div className="col-span-12 sm:col-span-4">
				<SectionReveal delay={0.12}>
					<Card className="h-full rounded-[2rem] shadow-level-1 p-4 flex items-center justify-center">
						<DailyProgressRing />
					</Card>
				</SectionReveal>
			</div>
		</div>
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
						className="min-h-[100dvh] flex items-center justify-center px-4"
					>
						<div className="w-full max-w-md flex flex-col gap-3">
							<Skeleton className="h-24 rounded-[2rem]" />
							<div className="grid grid-cols-12 gap-3">
								<Skeleton className="col-span-8 h-24 rounded-[2rem]" />
								<Skeleton className="col-span-4 h-24 rounded-[2rem]" />
							</div>
							<Skeleton className="h-32 rounded-[2rem]" />
							<Skeleton className="h-20 rounded-[2rem]" />
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
						className="min-h-[100dvh] flex flex-col bg-system-grouped pt-4 pb-[calc(var(--spacing-safe-pb)+var(--space-16)+var(--space-5))] overflow-x-hidden overflow-y-auto w-full"
					>
						<div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-8">
							{/* Hero Banner — anti-center bias: left-aligned text, right decorative */}
							<HeroBanner />

							{/* Countdown */}
							<CountdownHeader />

							{/* Row 1: Stats (2/3) + Ring (1/3) */}
							<SectionReveal delay={0.05}>
								<BentoStatRow
									questionsAnswered={stats.questionsAnswered}
									accuracy={stats.accuracy}
								/>
							</SectionReveal>

							{/* Row 2: Today's Focus (full width) */}
							<SectionReveal delay={0.1}>
								<TodayFocusCard />
							</SectionReveal>

							{/* Row 3: Quick Actions (full width, staggered) */}
							{practiceOpen ? null : (
								<SectionReveal delay={0.15}>
									<StaggerList>
										<QuickActions onPracticeClick={handlePracticeClick} />
									</StaggerList>
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
