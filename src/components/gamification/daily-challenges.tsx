"use client";

import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { AnimatedProgressBar } from "@/components/shared/animated-progress-bar";
import { FadeIn } from "@/components/shared/fade-in";
import type { DailyChallenge } from "@/types/gamification";

interface DailyChallengesProps {
	challenges: DailyChallenge[];
}

export function DailyChallenges({ challenges }: DailyChallengesProps) {
	const completedCount = challenges.filter((c) => c.completed).length;
	const allCompleted = completedCount === challenges.length;

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="font-semibold text-foreground text-sm">
						Daily Challenges
					</span>
					{allCompleted && (
						<m.span
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							className="rounded-full bg-success/20 px-2 py-0.5 text-success-foreground text-xs"
						>
							Complete!
						</m.span>
					)}
				</div>
				<span className="text-muted-foreground text-xs">
					{completedCount} / {challenges.length}
				</span>
			</div>

			<div className="flex flex-col gap-2">
				{challenges.map((challenge, index) => (
					<FadeIn
						key={challenge.id}
						direction="left"
						distance={10}
						delay={index * 0.1}
						className={`relative overflow-hidden rounded-xl p-3 transition-colors ${
							challenge.completed
								? "border border-success/20 bg-success/20"
								: "border border-border/50 bg-card hover:border-[--system-accent]/30"
						}`}
					>
						<div className="flex items-center gap-3">
							<div
								className={`flex size-10 items-center justify-center rounded-lg text-lg ${
									challenge.completed ? "bg-success/20" : "bg-muted"
								}`}
							>
								{challenge.completed ? "✓" : challenge.icon}
							</div>

							<div className="min-w-0 flex-1">
								<div className="mb-1 flex items-center justify-between">
									<span
										className={`font-medium text-sm ${
											challenge.completed
												? "text-success-foreground"
												: "text-foreground"
										}`}
									>
										{challenge.title}
									</span>
									<span className="text-muted-foreground text-xs">
										+{challenge.xpReward} XP
									</span>
								</div>

								<p className="mb-2 text-muted-foreground text-xs">
									{challenge.description}
								</p>

								{!challenge.completed && challenge.type === "questions" && (
									<AnimatedProgressBar
										value={(challenge.progress / challenge.target) * 100}
										size="md"
										color="accent"
										trackClassName="bg-secondary"
									/>
								)}

								{challenge.completed && (
									<m.div
										initial={{ scale: 0.95, opacity: 0 }}
										animate={{ scale: 1, opacity: 1 }}
										transition={{ type: "spring", stiffness: 400, damping: 20 }}
										className="flex items-center gap-1 text-success-foreground text-xs"
									>
										<HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
										Completed
									</m.div>
								)}
							</div>
						</div>
					</FadeIn>
				))}
			</div>
		</div>
	);
}
