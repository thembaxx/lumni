"use client";

import { IconFlame, IconTarget, IconTrendingUp } from "@tabler/icons-react";
import {
	AnimatePresence,
	domAnimation,
	LazyMotion,
	m,
	useReducedMotion,
} from "framer-motion";
import { Card } from "@/components/ui/card";

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
	bgClass: string;
	index: number;
	animate?: boolean;
}

const easeOutQuint = [0.22, 1, 0.36, 1] as const;

const streakMilestones = [3, 7, 14, 30] as const;
const milestoneMessages: Record<number, string> = {
	3: "Getting hot",
	7: "Week warrior",
	14: "Unstoppable",
	30: "Legendary",
};

function isStreakMilestone(streak: number): boolean {
	return streak >= 3 && streakMilestones.includes(streak);
}

function StatCard({
	label,
	value,
	icon: Icon,
	colorClass,
	bgClass,
	index,
	animate = false,
}: StatItemProps) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<m.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.4,
				ease: easeOutQuint,
				delay: shouldReduceMotion ? 0 : index * 0.1,
			}}
			whileHover={shouldReduceMotion ? undefined : { scale: 1.03 }}
		>
			<Card className="p-4 flex flex-col h-full items-center justify-center gap-2 select-none relative overflow-hidden">
				{animate && (
					<AnimatePresence>
						<m.div
							initial={{ opacity: 0, scale: 0 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0 }}
							transition={{ duration: 0.3, ease: easeOutQuint }}
							className="absolute inset-0 pointer-events-none flex items-center justify-center"
						>
							<div className="absolute inset-0 bg-success/5" />
						</m.div>
					</AnimatePresence>
				)}

				<m.div
					className={`p-2 rounded-full ${bgClass}`}
					initial={{ scale: 0.85, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					transition={{
						duration: shouldReduceMotion ? 0 : 0.3,
						ease: easeOutQuint,
						delay: shouldReduceMotion ? 0 : index * 0.1 + 0.2,
					}}
					whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
				>
					<Icon className={`w-5 h-5 ${colorClass}`} />
				</m.div>
				<div className="text-center">
					<p className="text-2xl font-bold tabular-nums">{value}</p>
					<p className="text-xs text-muted-foreground line-clamp-2">{label}</p>
				</div>
			</Card>
		</m.div>
	);
}

export function StatsCards({
	streak,
	questionsAnswered,
	accuracy,
}: StatsCardsProps) {
	const shouldReduceMotion = useReducedMotion();
	const hasStreak = streak > 0;
	const showMilestone = isStreakMilestone(streak);
	const milestoneMsg = milestoneMessages[streak] ?? null;

	return (
		<LazyMotion features={domAnimation}>
			<div className="relative">
				{showMilestone && (
					<m.div
						initial={{ opacity: 0, x: -4 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ duration: 0.3, ease: easeOutQuint }}
						className="absolute -top-6 left-0 flex items-center gap-1"
					>
						<m.span
							animate={
								shouldReduceMotion
									? {}
									: {
											scale: [1, 1.15, 1],
											rotate: [0, -5, 5, 0],
										}
							}
							transition={{
								duration: 1.2,
								repeat: Infinity,
								ease: easeOutQuint,
							}}
							className="text-warning text-sm"
						>
							🔥
						</m.span>
						<span className="text-xs font-semibold text-warning">
							{milestoneMsg}
						</span>
					</m.div>
				)}

				<div className="grid grid-cols-3 gap-3">
					<StatCard
						label="Current Streak"
						value={streak}
						icon={IconFlame}
						colorClass={hasStreak ? "text-warning" : "text-muted-foreground"}
						bgClass={hasStreak ? "bg-warning/10" : "bg-muted/20"}
						index={0}
						animate={hasStreak}
					/>
					<StatCard
						label="Questions"
						value={questionsAnswered}
						icon={IconTarget}
						colorClass="text-info"
						bgClass="bg-info/10"
						index={1}
					/>
					<StatCard
						label="Accuracy"
						value={accuracy}
						icon={IconTrendingUp}
						colorClass="text-success"
						bgClass="bg-success/10"
						index={2}
					/>
				</div>
			</div>
		</LazyMotion>
	);
}
