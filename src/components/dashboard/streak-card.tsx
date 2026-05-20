"use client";

import { FireIcon, PlayFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/shared";

export function StreakCard() {
	const { gamification, currentStreak } = useGamification();
	const { push } = useRouter();

	const today = new Date().toDateString();
	const practicedToday = gamification.lastPracticeDate === today;

	return (
		<motion.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card className="overflow-hidden rounded-[2rem] shadow-level-1">
				<CardContent className="p-5">
					<div className="flex items-center gap-4">
						<div
							className={cn(
								"flex size-12 items-center justify-center rounded-2xl transition-colors",
								currentStreak > 0
									? "bg-orange-500/15 text-orange-500"
									: "bg-muted text-muted-foreground",
							)}
						>
							<HugeiconsIcon
								icon={FireIcon}
								className={cn("size-6", currentStreak > 0 && "animate-pulse")}
							/>
						</div>
						<div className="flex-1">
							<p className="font-extrabold text-lg tabular-nums">
								{currentStreak > 0
									? `${currentStreak} day streak`
									: "No streak yet"}
							</p>
							<p className="mt-0.5 text-muted-foreground text-xs">
								{practicedToday
									? "Studied today! Keep it going."
									: currentStreak > 0
										? "Study today to keep your streak alive!"
										: "Start a streak by practicing today."}
							</p>
							{currentStreak === 0 && !practicedToday && (
								<Button
									size="sm"
									variant="outline"
									className="mt-3 h-8 gap-1.5 text-xs"
									onClick={() => push("/quiz")}
								>
									<HugeiconsIcon icon={PlayFreeIcons} className="size-3.5" />
									Start practicing
								</Button>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</motion.div>
	);
}
