"use client";

import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { FadeIn } from "@/components/shared/fade-in";
import type { LevelInfo } from "@/types/gamification";

interface XpLevelCardProps {
	levelInfo: LevelInfo;
	totalXp: number;
}

export function XpLevelCard({ levelInfo, totalXp }: XpLevelCardProps) {
	const t = useTranslations();
	return (
		<FadeIn
			distance={10}
			className="relative overflow-hidden rounded-lg border border-border/50 bg-system-accent/10 p-5"
		>
			<div className="flex items-center gap-4">
				<m.div
					className="relative flex size-14 items-center justify-center rounded-full bg-system-accent shadow-lg"
					initial={{ scale: 0.8 }}
					animate={{ scale: 1 }}
					transition={{ type: "spring", stiffness: 300, damping: 20 }}
				>
					<span className="font-extrabold text-2xl text-white">
						{levelInfo.level}
					</span>
				</m.div>

				<div className="flex-1">
					<div className="mb-1 flex items-center justify-between">
						<span className="font-extrabold text-foreground text-sm">
							{levelInfo.title}
						</span>
						<span className="font-medium text-muted-foreground text-xs">
							{t("gamification.xpLabel", {
								xp: totalXp.toLocaleString("en-ZA"),
							})}
						</span>
					</div>

					<AnimatedProgressBar
						value={levelInfo.progress}
						size="xl"
						color="accent"
					/>

					<p className="mt-1 font-medium text-muted-foreground text-xs">
						{t("gamification.xpProgress", {
							currentXp: levelInfo.currentXp,
							xpToNextLevel: levelInfo.xpToNextLevel,
							level: levelInfo.level + 1,
						})}
					</p>
				</div>
			</div>
		</FadeIn>
	);
}
