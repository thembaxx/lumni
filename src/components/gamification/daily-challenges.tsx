"use client";

import { IconCheck } from "@tabler/icons-react";
import { motion } from "framer-motion";
import type { DailyChallenge } from "@/lib/types/gamification";

interface DailyChallengesProps {
	challenges: DailyChallenge[];
}

export function DailyChallenges({ challenges }: DailyChallengesProps) {
	const completedCount = challenges.filter((c) => c.completed).length;
	const allCompleted = completedCount === challenges.length;

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-sm font-semibold text-foreground">
						Daily Challenges
					</span>
					{allCompleted && (
						<motion.span
							initial={{ scale: 0 }}
							animate={{ scale: 1 }}
							className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full"
						>
							Complete!
						</motion.span>
					)}
				</div>
				<span className="text-xs text-muted-foreground">
					{completedCount} / {challenges.length}
				</span>
			</div>

			<div className="space-y-2">
				{challenges.map((challenge, index) => (
					<motion.div
						key={challenge.id}
						initial={{ opacity: 0, x: -10 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: index * 0.1 }}
						className={`relative overflow-hidden rounded-xl p-3 transition-all ${
							challenge.completed
								? "bg-green-500/10 border border-green-500/20"
								: "bg-card border border-border/50 hover:border-primary/30"
						}`}
					>
						<div className="flex items-center gap-3">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-lg text-lg ${
									challenge.completed ? "bg-green-500/20" : "bg-muted"
								}`}
							>
								{challenge.completed ? "✓" : challenge.icon}
							</div>

							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between mb-1">
									<span
										className={`text-sm font-medium ${
											challenge.completed
												? "text-green-600 dark:text-green-400"
												: "text-foreground"
										}`}
									>
										{challenge.title}
									</span>
									<span className="text-xs text-muted-foreground">
										+{challenge.xpReward} XP
									</span>
								</div>

								<p className="text-xs text-muted-foreground mb-2">
									{challenge.description}
								</p>

								{!challenge.completed && challenge.type === "questions" && (
									<div className="relative h-1.5 bg-secondary rounded-full overflow-hidden">
										<motion.div
											className="absolute inset-y-0 left-0 rounded-full bg-primary"
											initial={{ width: 0 }}
											animate={{
												width: `${(challenge.progress / challenge.target) * 100}%`,
											}}
											transition={{ duration: 0.5 }}
										/>
									</div>
								)}

								{challenge.completed && (
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"
									>
										<IconCheck size={12} />
										Completed
									</motion.div>
								)}
							</div>
						</div>
					</motion.div>
				))}
			</div>
		</div>
	);
}
