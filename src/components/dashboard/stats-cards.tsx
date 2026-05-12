"use client";

import { IconFlame, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { iOSEase, easeOutQuint } from "@/lib/utils/animation";

interface StatsCardsProps {
	streak: number;
	questionsAnswered: number;
	accuracy: number;
}

interface StatItemProps {
	label: string;
	value: number;
	icon: React.ComponentType<{ className?: string }>;
	colorClass: string;
	accentClass: string;
	index: number;
}

const streakMilestones = [3, 7, 14, 30] as const;
const milestoneMessages: Record<number, string> = {
	3: "Getting hot",
	7: "Week warrior",
	14: "Unstoppable",
	30: "Legendary",
};

function isStreakMilestone(streak: number): boolean {
	return (
		streak >= 3 && (streakMilestones as readonly number[]).includes(streak)
	);
}

function StatCard({
	label,
	value,
	icon: Icon,
	colorClass,
	accentClass,
	index,
}: StatItemProps) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.35,
				ease: iOSEase,
				delay: shouldReduceMotion ? 0 : index * 0.05,
			}}
		>
			<Card className="relative p-4 flex flex-col h-full items-center justify-start gap-3 overflow-hidden cursor-default">
				<div
					className={`absolute top-0 left-0 right-0 h-1 ${accentClass} opacity-80`}
				/>

				<div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-[--system-surface] shadow-[--shadow-level-1]">
					<Icon className={`w-5 h-5 ${colorClass}`} />
				</div>

				<div className="text-center space-y-1">
					<p className="text-2xl font-semibold tracking-tight text-[--system-text-primary] tabular-nums text-wrap balance">
						{value}
					</p>
					<p className="ios-footnote text-[--system-text-secondary] font-medium leading-tight">
						{label}
					</p>
				</div>
			</Card>
		</motion.div>
	);
}

export function StatsCards({
	streak,
	questionsAnswered,
	accuracy,
}: StatsCardsProps) {
	const hasStreak = streak > 0;
	const showMilestone = isStreakMilestone(streak);
	const milestoneMsg = milestoneMessages[streak] ?? null;

	return (
		<div className="relative">
			{showMilestone && (
				<motion.div
					initial={{ opacity: 0, x: -8 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.4, ease: iOSEase }}
					className="absolute -top-5 left-0 flex items-center gap-1.5"
				>
					<span className="text-warning text-sm">🔥</span>
					<span className="text-[13px] font-semibold text-warning tracking-tight">
						{milestoneMsg}
					</span>
				</motion.div>
			)}

			<div className="grid grid-cols-3 gap-3">
				<StatCard
					label="Streak"
					value={streak}
					icon={IconFlame}
					colorClass={
						hasStreak
							? "text-[oklch(var(--warning))]"
							: "text-[oklch(var(--muted-foreground))]"
					}
					accentClass={
						hasStreak
							? "bg-[oklch(var(--warning))]"
							: "bg-[oklch(var(--border))]"
					}
					index={0}
				/>
				<StatCard
					label="Questions"
					value={questionsAnswered}
					icon={IconTarget}
					colorClass="text-[oklch(var(--info))]"
					accentClass="bg-[oklch(var(--info))]"
					index={1}
				/>
				<StatCard
					label="Accuracy"
					value={accuracy}
					icon={IconTrendingUp}
					colorClass="text-[oklch(var(--success))]"
					accentClass="bg-[oklch(var(--success))]"
					index={2}
				/>
			</div>
		</div>
	);
}
