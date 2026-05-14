"use client";

import { motion } from "framer-motion";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { FadeIn } from "@/components/shared/fade-in";
import type { LevelInfo } from "@/types/gamification";

interface XpLevelCardProps {
	levelInfo: LevelInfo;
	totalXp: number;
}

export function XpLevelCard({ levelInfo, totalXp }: XpLevelCardProps) {
	return (
		<FadeIn
			distance={10}
			className="relative overflow-hidden rounded-lg bg-system-accent/10 border border-border/50 p-5"
		>
			<div className="flex items-center gap-4">
				<motion.div
					className="relative flex size-14 items-center justify-center rounded-full bg-system-accent shadow-lg"
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<span className="text-2xl font-extrabold text-white">
						{levelInfo.level}
					</span>
				</motion.div>

				<div className="flex-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-sm font-extrabold text-foreground">
							{levelInfo.title}
						</span>
						<span className="text-xs text-muted-foreground font-medium">
							{totalXp.toLocaleString("en-ZA")} XP
						</span>
					</div>

					<AnimatedProgressBar
						value={levelInfo.progress}
						size="xl"
						color="accent"
					/>

					<p className="text-xs text-muted-foreground mt-1 font-medium">
						{levelInfo.currentXp} / {levelInfo.xpToNextLevel} XP to Level{" "}
						{levelInfo.level + 1}
					</p>
				</div>
			</div>
		</FadeIn>
	);
}
