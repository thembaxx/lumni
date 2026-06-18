"use client";

import { FireIcon, PlayFreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/shared";

export const StreakCard = memo(function StreakCard() {
	const { gamification, currentStreak } = useGamification();
	const { push } = useRouter();

	const today = new Date().toDateString();
	const practicedToday = gamification.lastPracticeDate === today;

	return (
		<m.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card
				className={cn(
					"overflow-hidden rounded-2xl shadow-level-1 transition-colors",
					currentStreak > 0
						? "border border-warning/20 bg-warning/5"
						: "border border-border/80",
				)}
			>
				<CardContent className="p-5">
					<div className="flex items-center gap-4">
						<div
							className={cn(
								"flex size-14 items-center justify-center rounded-2xl transition-colors",
								currentStreak > 0
									? "bg-orange-500/15 text-orange-500 dark:bg-orange-400/15 dark:text-orange-300"
									: "bg-muted text-muted-foreground",
							)}
						>
							<HugeiconsIcon
								icon={FireIcon}
								className={cn("size-7", currentStreak > 0 && "animate-pulse")}
							/>
						</div>
						<div className="flex-1">
							<div className="flex items-baseline gap-2">
								<span className="font-extrabold text-3xl text-foreground tabular-nums tracking-tight">
									{currentStreak}
								</span>
								<span className="font-medium text-muted-foreground text-xs">
									{currentStreak === 1 ? "day" : "days"}
								</span>
							</div>
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
									className="mt-3 h-10 gap-1.5 text-xs active:scale-[0.96]"
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
		</m.div>
	);
});
