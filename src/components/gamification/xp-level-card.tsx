"use client";

import { motion } from "framer-motion";
import type { LevelInfo } from "@/lib/types/gamification";

interface XpLevelCardProps {
	levelInfo: LevelInfo;
	totalXp: number;
}

export function XpLevelCard({ levelInfo, totalXp }: XpLevelCardProps) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-card border border-border/50 p-4"
		>
			<div className="flex items-center gap-4">
				<motion.div
					className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg"
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<span className="text-2xl font-bold text-primary-foreground">
						{levelInfo.level}
					</span>
					<motion.div
						className="absolute inset-0 rounded-full"
						animate={{
							boxShadow: [
								"0 0 0 0 rgba(20, 184, 166, 0)",
								"0 0 20px 4px rgba(20, 184, 166, 0.3)",
								"0 0 0 0 rgba(20, 184, 166, 0)",
							],
						}}
						transition={{ duration: 2, repeat: Infinity }}
					/>
				</motion.div>

				<div className="flex-1">
					<div className="flex items-center justify-between mb-1">
						<span className="text-sm font-semibold text-foreground">
							{levelInfo.title}
						</span>
						<span className="text-xs text-muted-foreground">
							{totalXp.toLocaleString()} XP
						</span>
					</div>

					<div className="relative h-3 bg-secondary rounded-full overflow-hidden">
						<motion.div
							className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/80"
							initial={{ width: 0 }}
							animate={{ width: `${levelInfo.progress}%` }}
							transition={{ duration: 0.8, ease: "easeOut" }}
						/>
						<motion.div
							className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
							animate={{ x: ["-100%", "100%"] }}
							transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
						/>
					</div>

					<p className="text-xs text-muted-foreground mt-1">
						{levelInfo.currentXp} / {levelInfo.xpToNextLevel} XP to Level{" "}
						{levelInfo.level + 1}
					</p>
				</div>
			</div>
		</motion.div>
	);
}
