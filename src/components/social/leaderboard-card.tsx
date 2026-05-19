"use client";

import { Award01Icon, CrownIcon, FireIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
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
	const { data: entries = [] } = useQuery({
		queryKey: ["leaderboard"],
		queryFn: () => getWeeklyLeaderboard(),
	});

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
					<p className="py-4 text-center text-muted-foreground text-sm">
						No rankings yet. Start studying to appear here!
					</p>
				) : (
					<div className="space-y-2">
						{entries.map((entry, i) => (
							<div
								key={entry.rank}
								className={cn(
									"flex items-center gap-3 rounded-xl p-2.5 transition-colors",
									entry.isCurrentUser && "bg-accent",
								)}
							>
								<div className="w-6 shrink-0 text-center">
									{i < 3 ? (
										<HugeiconsIcon
											icon={Award01Icon}
											size={18}
											className={rankColors[i]}
										/>
									) : (
										<span className="font-mono text-muted-foreground text-xs">
											{entry.rank}
										</span>
									)}
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">{entry.label}</p>
								</div>
								<div className="flex shrink-0 items-center gap-2">
									<span className="font-bold text-sm tabular-nums">
										{entry.xp.toLocaleString()} XP
									</span>
									{entry.streak > 0 && (
										<div className="flex items-center gap-0.5 text-muted-foreground text-xs">
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
