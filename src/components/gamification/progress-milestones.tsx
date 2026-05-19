"use client";

import { motion } from "framer-motion";
import { FadeIn } from "@/components/shared/fade-in";
import type { StreakMilestone } from "@/types/gamification";

interface ProgressMilestonesProps {
	currentStreak: number;
	milestones: StreakMilestone[];
}

export function ProgressMilestones({
	currentStreak,
	milestones,
}: ProgressMilestonesProps) {
	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-semibold text-foreground text-sm">
				Streak Milestones
			</h3>

			<div className="relative">
				<div className="absolute top-5 right-0 left-0 h-1 rounded-full bg-secondary" />

				<div className="relative flex justify-between">
					{milestones.map((milestone, index) => {
						const isUnlocked = milestone.unlocked;
						const isCurrent =
							currentStreak >= milestone.streak &&
							(index === milestones.length - 1 ||
								currentStreak < milestones[index + 1].streak);

						return (
							<FadeIn
								key={milestone.streak}
								distance={10}
								delay={index * 0.1}
								className="flex flex-col items-center"
							>
								<motion.div
									className={`relative z-10 flex size-10 items-center justify-center rounded-full border-4 transition-border-color transition-colors ${
										isUnlocked
											? "border-[--system-accent] bg-[--system-accent] text-background"
											: isCurrent
												? "border-[--system-accent] bg-[--system-accent]/20"
												: "border-border bg-card"
									}`}
									whileHover={{ scale: 1.1 }}
								>
									{isUnlocked ? (
										<motion.span
											initial={{ scale: 0 }}
											animate={{ scale: 1 }}
											className="text-lg"
										>
											✓
										</motion.span>
									) : (
										<span className="font-medium text-muted-foreground text-xs">
											{milestone.streak}
										</span>
									)}
								</motion.div>

								<div className="mt-2 text-center">
									<p
										className={`font-medium text-xs ${
											isUnlocked
												? "text-[--system-accent]"
												: "text-muted-foreground"
										}`}
									>
										{milestone.streak} days
									</p>
									<p className="max-w-[60px] text-[10px] text-muted-foreground leading-tight">
										{milestone.reward.split(" ")[0]}
									</p>
								</div>
							</FadeIn>
						);
					})}
				</div>
			</div>
		</div>
	);
}
