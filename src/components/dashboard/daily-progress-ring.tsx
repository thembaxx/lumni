"use client";

import { Fire02FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { RadialChart } from "@/components/ui/charts/radial-chart";
import { useGamification } from "@/hooks/use-gamification";
import { iOSEase } from "@/lib/utils/animation";

export function DailyProgressRing() {
	const { levelInfo, gamification, currentStreak } = useGamification();
	const shouldReduceMotion = useReducedMotion();

	const daily = gamification.dailyChallenges[0];
	const progress = daily ? Math.min(daily.progress / daily.target, 1) : 0;
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
			style={{ willChange: "transform, opacity" }}
		>
			<RadialChart
				value={progress * 100}
				size={136}
				color={isComplete ? "var(--success)" : "var(--system-accent)"}
			>
				<div className="flex flex-col items-center">
					<motion.span
						initial={shouldReduceMotion ? false : { scale: 0.8, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						transition={{
							duration: 0.4,
							ease: iOSEase,
							delay: shouldReduceMotion ? 0 : 0.2,
						}}
						className="text-3xl font-extrabold text-foreground tabular-nums"
					>
						{levelInfo.level}
					</motion.span>
					<span className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
						{levelInfo.title}
					</span>
				</div>
			</RadialChart>

			<div className="flex items-center gap-4 mt-4">
				<div className="flex items-center gap-1.5">
					<motion.span
						animate={
							shouldReduceMotion || currentStreak === 0
								? {}
								: { scale: [1, 1.2, 1] }
						}
						transition={{
							duration: 1.5,
							repeat: Infinity,
							ease: iOSEase,
						}}
					>
						<HugeiconsIcon
							icon={Fire02FreeIcons}
							className={`size-5 transition-colors duration-300 ${currentStreak > 0 ? "text-warning" : "text-muted-foreground"}`}
						/>
					</motion.span>
					<span className="text-lg font-extrabold text-foreground tabular-nums">
						{currentStreak}
					</span>
					<span className="text-xs text-muted-foreground font-medium">
						day streak
					</span>
				</div>
				<div className="h-6 w-px bg-border/40" />
				<div className="text-right">
					<p className="text-lg font-extrabold text-foreground tabular-nums">
						{gamification.totalXp.toLocaleString("en-ZA")}
					</p>
					<p className="text-xs text-muted-foreground font-medium">total XP</p>
				</div>
			</div>

			<motion.div
				className="mt-3 flex items-center gap-2"
				animate={
					isComplete && !shouldReduceMotion
						? { scale: [1, 1.02, 1] }
						: { scale: 1 }
				}
				transition={{
					duration: 2,
					repeat: isComplete ? Infinity : 0,
					ease: iOSEase,
				}}
			>
				<AnimatedProgressBar
					value={progress * 100}
					size="md"
					color={isComplete ? "success" : "accent"}
					trackClassName="bg-border/40"
					className="w-32"
				/>
				<span className="text-xs text-muted-foreground font-medium tabular-nums">
					{daily?.progress ?? 0} / {daily?.target ?? 10}
				</span>
			</motion.div>
			<div className="relative h-5 mt-0.5 flex items-center justify-center">
				<AnimatePresence mode="wait">
					{isComplete ? (
						<motion.div
							key="complete"
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							exit={{ scale: 0, opacity: 0 }}
							transition={{ type: "spring", duration: 0.3, bounce: 0 }}
							className="flex items-center gap-1"
						>
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className="size-3.5 text-success"
							/>
							<span className="text-[11px] font-extrabold text-success">
								Daily goal complete
							</span>
						</motion.div>
					) : (
						<motion.p
							key="incomplete"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="text-[11px] text-muted-foreground font-medium"
						>
							questions today
						</motion.p>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}
