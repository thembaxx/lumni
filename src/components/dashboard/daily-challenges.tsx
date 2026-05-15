"use client";

import { CheckCircle, Fire, Target } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";

const challengeIcons: Record<string, typeof Target> = {
	questions: Target,
	accuracy: Target,
	streak: Fire,
	subject: Target,
};

export function DailyChallenges() {
	const { gamification } = useGamification();

	const active = gamification.dailyChallenges.filter((c) => !c.completed);
	const completed = gamification.dailyChallenges.filter((c) => c.completed);

	if (active.length === 0 && completed.length === 0) return null;

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: iOSEase }}
		>
			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle className="text-base font-extrabold tracking-tight">
						Daily Challenges
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{[...active, ...completed].map((challenge) => {
						const Icon = challengeIcons[challenge.type] || Target;
						const progress =
							challenge.target > 0
								? Math.round((challenge.progress / challenge.target) * 100)
								: 0;

						return (
							<div
								key={challenge.id}
								className={cn(
									"flex items-center gap-3 p-3 rounded-xl transition-colors",
									challenge.completed ? "bg-success/10" : "bg-muted/30",
								)}
							>
								<div
									className={cn(
										"size-9 rounded-xl flex items-center justify-center shrink-0",
										challenge.completed
											? "bg-success/20 text-success"
											: "bg-[--system-accent]/10 text-[--system-accent]",
									)}
								>
									{challenge.completed ? (
										<CheckCircle weight="fill" className="size-5" />
									) : (
										<Icon className="size-5" />
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-semibold">{challenge.title}</p>
									<p className="text-xs text-muted-foreground">
										{challenge.description}
									</p>
									{!challenge.completed && (
										<div className="flex items-center gap-2 mt-1.5">
											<div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
												<div
													className="h-full rounded-full bg-[--system-accent] transition-all"
													style={{ width: `${Math.min(progress, 100)}%` }}
												/>
											</div>
											<span className="text-[10px] font-medium tabular-nums text-muted-foreground">
												{challenge.progress}/{challenge.target}
											</span>
										</div>
									)}
								</div>
								{challenge.completed && (
									<span className="text-xs font-semibold text-success shrink-0">
										+{challenge.xpReward} XP
									</span>
								)}
							</div>
						);
					})}
				</CardContent>
			</Card>
		</motion.div>
	);
}
