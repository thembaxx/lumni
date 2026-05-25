"use client";

import { m } from "framer-motion";
import { useTranslations } from "next-intl";
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
	const t = useTranslations();
	return (
		<div className="flex flex-col gap-3">
			<h3 className="font-semibold text-foreground text-sm">
				{t("gamification.streakMilestones")}
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
								<m.div
									className={`relative z-elevated flex size-10 items-center justify-center rounded-full border-4 transition-border-color transition-colors ${
										isUnlocked
											? "border-[--system-accent] bg-[--system-accent] text-background"
											: isCurrent
												? "border-[--system-accent] bg-[--system-accent]/20"
												: "border-border bg-card"
									}`}
									whileHover={{ scale: 1.1 }}
								>
									{isUnlocked ? (
										<m.span
											initial={{ scale: 0.95, opacity: 0 }}
											animate={{ scale: 1, opacity: 1 }}
											className="text-lg"
										>
											✓
										</m.span>
									) : (
										<span className="font-medium text-muted-foreground text-xs">
											{milestone.streak}
										</span>
									)}
								</m.div>

								<div className="mt-2 text-center">
									<p
										className={`font-medium text-xs ${
											isUnlocked
												? "text-[--system-accent]"
												: "text-muted-foreground"
										}`}
									>
										{t("gamification.milestoneStreakDays", { streak: milestone.streak })}
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
