"use client";

import { motion } from "framer-motion";
import { iOSEase } from "@/lib/utils/animation";
import type { LevelInfo } from "@/types/gamification";

interface XpLevelCardProps {
	levelInfo: LevelInfo;
	totalXp: number;
}

export function XpLevelCard({ levelInfo, totalXp }: XpLevelCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="relative overflow-hidden rounded-lg bg-system-accent/10 border border-border/50 p-5"
		>
			<div className="flex items-center gap-4">
				<motion.div
					className="relative flex h-14 w-14 items-center justify-center rounded-full bg-system-accent shadow-lg"
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<span className="text-2xl font-bold text-white">
						{levelInfo.level}
					</span>
				</motion.div>

				<div className="flex-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-sm font-bold text-foreground">
							{levelInfo.title}
						</span>
						<span className="text-xs text-muted-foreground font-medium">
							{totalXp.toLocaleString("en-ZA")} XP
						</span>
					</div>

					<div className="relative h-3 bg-secondary/50 rounded-full overflow-hidden">
						<motion.div
							className="absolute inset-y-0 left-0 rounded-full bg-system-accent"
							initial={{ width: 0 }}
							animate={{ width: `${levelInfo.progress}%` }}
							transition={{ duration: 0.8, ease: iOSEase }}
						/>
					</div>

					<p className="text-xs text-muted-foreground mt-1 font-medium">
						{levelInfo.currentXp} / {levelInfo.xpToNextLevel} XP to Level{" "}
						{levelInfo.level + 1}
					</p>
				</div>
			</div>
		</motion.div>
	);
}
