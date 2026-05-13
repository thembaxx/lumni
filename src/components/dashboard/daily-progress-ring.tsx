"use client";

import { IconFlame } from "@tabler/icons-react";
import { motion, useReducedMotion } from "framer-motion";
import { useGamification } from "@/hooks/use-gamification";
import { iOSEase } from "@/lib/utils/animation";

const SIZE = 136;
const STROKE = 8;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

export function DailyProgressRing() {
	const { levelInfo, gamification, currentStreak } =
		useGamification();
	const shouldReduceMotion = useReducedMotion();

	const daily = gamification.dailyChallenges[0];
	const progress = daily ? Math.min(daily.progress / daily.target, 1) : 0;
	const offset = C * (1 - progress);
	const isComplete = daily?.completed ?? false;

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.92 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{
				duration: shouldReduceMotion ? 0 : 0.5,
				ease: iOSEase,
			}}
			className="flex flex-col items-center py-4"
		>
			<div className="relative" style={{ width: SIZE, height: SIZE }}>
				<svg
					width={SIZE}
					height={SIZE}
					className="transform -rotate-90"
					aria-hidden
				>
					<circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={R}
						fill="none"
						stroke="currentColor"
						strokeWidth={STROKE}
						className="text-border/40"
					/>
					<motion.circle
						cx={SIZE / 2}
						cy={SIZE / 2}
						r={R}
						fill="none"
						stroke="currentColor"
						strokeWidth={STROKE}
						strokeLinecap="round"
						strokeDasharray={C}
						initial={shouldReduceMotion ? false : { strokeDashoffset: C }}
						animate={{ strokeDashoffset: offset }}
						transition={{ duration: 1, ease: iOSEase }}
						className={isComplete ? "text-success" : "text-system-accent"}
					/>
				</svg>
				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<motion.span
						initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{
							duration: 0.4,
							ease: iOSEase,
							delay: shouldReduceMotion ? 0 : 0.2,
						}}
						className="text-3xl font-bold text-foreground tabular-nums"
					>
						{levelInfo.level}
					</motion.span>
					<span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
						{levelInfo.title}
					</span>
				</div>
			</div>

			<div className="flex items-center gap-4 mt-4">
				<div className="flex items-center gap-1.5">
					<IconFlame
						className={`w-5 h-5 ${currentStreak > 0 ? "text-warning" : "text-muted-foreground"}`}
					/>
					<span className="text-lg font-bold text-foreground tabular-nums">
						{currentStreak}
					</span>
					<span className="text-xs text-muted-foreground font-medium">
						day streak
					</span>
				</div>
				<div className="h-6 w-px bg-border/40" />
				<div className="text-right">
					<p className="text-lg font-bold text-foreground tabular-nums">
						{gamification.totalXp.toLocaleString("en-ZA")}
					</p>
					<p className="text-xs text-muted-foreground font-medium">total XP</p>
				</div>
			</div>

			<div className="mt-3 flex items-center gap-2">
				<div className="h-1.5 w-32 rounded-full bg-border/40 overflow-hidden">
					<motion.div
						className={`h-full rounded-full ${isComplete ? "bg-success" : "bg-system-accent"}`}
						initial={{ width: 0 }}
						animate={{ width: `${progress * 100}%` }}
						transition={{ duration: 0.8, ease: iOSEase }}
					/>
				</div>
				<span className="text-xs text-muted-foreground font-medium tabular-nums">
					{daily?.progress ?? 0} / {daily?.target ?? 10}
				</span>
			</div>
			<p className="text-[11px] text-muted-foreground font-medium mt-0.5">
				questions today
			</p>
		</motion.div>
	);
}
