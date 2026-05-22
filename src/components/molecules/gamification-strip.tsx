"use client";

import { Award01Icon, FireIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/shared";

interface GamificationStripProps extends React.ComponentProps<typeof Card> {
	streak: number;
	points: number;
	level: number;
}

export function GamificationStrip({
	streak,
	points,
	level,
	className,
	...props
}: GamificationStripProps) {
	return (
		<Card className={cn("overflow-hidden", className)} {...props}>
			<CardContent className="flex items-center justify-between gap-4 p-4">
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-full bg-orange-500/10">
						<HugeiconsIcon
							icon={FireIcon}
							size={20}
							className="text-orange-500"
						/>
					</div>
					<div>
						<p className="font-semibold text-sm">{streak} day streak</p>
						<p className="text-muted-foreground text-xs">Keep it going!</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<div className="flex size-10 items-center justify-center rounded-full bg-primary/10">
						<HugeiconsIcon
							icon={Award01Icon}
							size={20}
							className="text-primary"
						/>
					</div>
					<div className="text-right">
						<p className="font-semibold text-sm">
							{points.toLocaleString()} XP
						</p>
						<p className="text-muted-foreground text-xs">Level {level}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
