"use client";

import { Award01Icon, CrownIcon, FireIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getWeeklyLeaderboard } from "@/lib/services/leaderboard-service";
import { cn } from "@/lib/shared";

const rankColors = [
	"text-amber-400",
	"text-zinc-400",
	"text-orange-700",
	"text-muted-foreground",
];

export function LeaderboardCard() {
	const entries = useMemo(() => getWeeklyLeaderboard(), []);

	return (
		<Card className="overflow-hidden">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<HugeiconsIcon
						icon={CrownIcon}
						size={20}
						className="text-amber-400"
					/>
					Weekly Leaderboard
				</CardTitle>
			</CardHeader>
			<CardContent>
				{entries.length === 0 ? (
					<p className="text-sm text-muted-foreground text-center py-4">
						No rankings yet. Start studying to appear here!
					</p>
				) : (
					<div className="space-y-2">
						{entries.map((entry, i) => (
							<div
								key={entry.rank}
								className={cn(
									"flex items-center gap-3 p-2.5 rounded-xl transition-colors",
									entry.isCurrentUser && "bg-accent",
								)}
							>
								<div className="w-6 text-center shrink-0">
									{i < 3 ? (
										<HugeiconsIcon
											icon={Award01Icon}
											size={18}
											className={rankColors[i]}
										/>
									) : (
										<span className="text-xs font-mono text-muted-foreground">
											{entry.rank}
										</span>
									)}
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-sm font-medium truncate">{entry.label}</p>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									<span className="text-sm font-bold tabular-nums">
										{entry.xp.toLocaleString()} XP
									</span>
									{entry.streak > 0 && (
										<div className="flex items-center gap-0.5 text-xs text-muted-foreground">
											<HugeiconsIcon icon={FireIcon} size={12} />
											<span>{entry.streak}</span>
										</div>
									)}
								</div>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
