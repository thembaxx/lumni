"use client";

import { Fire } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";

export function StreakCard() {
	const { gamification, currentStreak } = useGamification();

	const today = new Date().toDateString();
	const practicedToday = gamification.lastPracticeDate === today;

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card className="rounded-[2rem] shadow-level-1 overflow-hidden">
				<CardContent className="p-5">
					<div className="flex items-center gap-4">
						<div
							className={cn(
								"size-12 rounded-2xl flex items-center justify-center transition-colors",
								currentStreak > 0
									? "bg-orange-500/15 text-orange-500"
									: "bg-muted text-muted-foreground",
							)}
						>
							<Fire
								weight="fill"
								className={cn("size-6", currentStreak > 0 && "animate-pulse")}
							/>
						</div>
						<div className="flex-1">
							<p className="text-lg font-extrabold tabular-nums">
								{currentStreak > 0
									? `${currentStreak} day streak`
									: "No streak yet"}
							</p>
							<p className="text-xs text-muted-foreground mt-0.5">
								{practicedToday
									? "Studied today! Keep it going."
									: currentStreak > 0
										? "Study today to keep your streak alive!"
										: "Start a streak by practicing today."}
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
