"use client";

import {
	CheckmarkCircle01Icon,
	FireIcon,
	Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/shared";
import { iOSEase } from "@/lib/utils/animation";

const challengeIcons: Record<string, typeof Target01Icon> = {
	questions: Target01Icon,
	accuracy: Target01Icon,
	streak: FireIcon,
	subject: Target01Icon,
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
					<CardTitle className="font-extrabold text-base tracking-tight">
						Daily Challenges
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{[...active, ...completed].map((challenge) => {
						const Icon = challengeIcons[challenge.type] || Target01Icon;
						const progress =
							challenge.target > 0
								? Math.round((challenge.progress / challenge.target) * 100)
								: 0;

						return (
							<div
								key={challenge.id}
								className={cn(
									"flex items-center gap-3 rounded-xl p-3 transition-colors",
									challenge.completed ? "bg-success/10" : "bg-muted/30",
								)}
							>
								<div
									className={cn(
										"flex size-9 shrink-0 items-center justify-center rounded-xl",
										challenge.completed
											? "bg-success/20 text-success"
											: "bg-[--system-accent]/10 text-[--system-accent]",
									)}
								>
									{challenge.completed ? (
										<HugeiconsIcon
											icon={CheckmarkCircle01Icon}
											className="size-5"
										/>
									) : (
										<HugeiconsIcon icon={Icon} className="size-5" />
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="font-semibold text-sm">{challenge.title}</p>
									<p className="text-muted-foreground text-xs">
										{challenge.description}
									</p>
									{!challenge.completed && (
										<div className="mt-1.5 flex items-center gap-2">
											<div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
												<div
													className="h-full rounded-full bg-[--system-accent] transition-[width]"
													style={{ width: `${Math.min(progress, 100)}%` }}
												/>
											</div>
											<span className="font-medium text-[10px] text-muted-foreground tabular-nums">
												{challenge.progress}/{challenge.target}
											</span>
										</div>
									)}
								</div>
								{challenge.completed && (
									<span className="shrink-0 font-semibold text-success text-xs">
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
