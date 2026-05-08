"use client";

import { motion } from "framer-motion";
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
		<div className="space-y-3">
			<h3 className="text-sm font-semibold text-foreground">
				Streak Milestones
			</h3>

			<div className="relative">
				<div className="absolute top-5 left-0 right-0 h-1 bg-secondary rounded-full" />

				<div className="flex justify-between relative">
					{milestones.map((milestone, index) => {
						const isUnlocked = milestone.unlocked;
						const isCurrent =
							currentStreak >= milestone.streak &&
							(index === milestones.length - 1 ||
								currentStreak < milestones[index + 1].streak);

						return (
							<motion.div
								key={milestone.streak}
								className="flex flex-col items-center"
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: index * 0.1 }}
							>
								<motion.div
									className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-4 transition-all ${
										isUnlocked
											? "bg-primary border-primary text-primary-foreground"
											: isCurrent
												? "bg-primary/20 border-primary animate-pulse"
												: "bg-card border-border"
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
										<span className="text-xs font-medium text-muted-foreground">
											{milestone.streak}
										</span>
									)}
								</motion.div>

								<div className="mt-2 text-center">
									<p
										className={`text-xs font-medium ${
											isUnlocked ? "text-primary" : "text-muted-foreground"
										}`}
									>
										{milestone.streak} days
									</p>
									<p className="text-[10px] text-muted-foreground max-w-[60px] leading-tight">
										{milestone.reward.split(" ")[0]}
									</p>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
