"use client";

import { Award01Icon, CrownIcon, FireIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { client } from "@/lib/appwrite";
import { useAuth } from "@/lib/auth";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import {
	getWeeklyLeaderboard,
	type LeaderboardEntry,
} from "@/lib/services/leaderboard-service";
import { cn } from "@/lib/shared";

const rankColors = [
	"text-amber-400 dark:text-amber-300",
	"text-zinc-400 dark:text-zinc-300",
	"text-orange-700 dark:text-orange-400",
	"text-muted-foreground",
];

function useRealtimeIndicator() {
	const [liveSince, setLiveSince] = useState<Date | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;
		let unsub: (() => void) | undefined;
		const channel = `databases.${APPWRITE_DATABASE_ID}.collections.${COLLECTIONS.USER_GAMIFICATION}.documents`;

		try {
			unsub = client.subscribe(channel, () => {
				setLiveSince(new Date());
			});
		} catch {
			// Realtime unavailable — polling fallback
		}
		return () => unsub?.();
	}, []);

	return liveSince;
}

export function LeaderboardCard() {
	const { user } = useAuth();
	const currentUserId = user?.$id;
	const liveSince = useRealtimeIndicator();
	const prevEntriesRef = useRef<LeaderboardEntry[]>([]);
	const [rankChanged, setRankChanged] = useState(false);

	const { data: rawEntries = [] } = useQuery({
		queryKey: ["leaderboard"],
		queryFn: () => getWeeklyLeaderboard(),
		refetchInterval: 15_000,
	});

	const entries = rawEntries.map((entry) => ({
		...entry,
		isCurrentUser: entry.isCurrentUser || entry.userId === currentUserId,
	}));

	useEffect(() => {
		if (rankChanged) {
			const timer = setTimeout(() => setRankChanged(false), 3000);
			return () => clearTimeout(timer);
		}
	}, [rankChanged]);

	useEffect(() => {
		const prev = prevEntriesRef.current;
		if (prev.length > 0 && entries.length > 0) {
			const currentUserEntry = entries.find((e) => e.isCurrentUser);
			const prevUserEntry = prev.find((e) => e.isCurrentUser);
			if (
				currentUserEntry &&
				prevUserEntry &&
				currentUserEntry.rank < prevUserEntry.rank
			) {
				setRankChanged(true);
				toast({
					type: "success",
					message: `Leaderboard: #${prevUserEntry.rank} → #${currentUserEntry.rank}`,
					description: "You climbed the ranks! Keep studying!",
					duration: 4000,
				});
			}
		}
		prevEntriesRef.current = entries;
	}, [entries]);

	return (
		<Card className="overflow-hidden">
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-lg">
					<HugeiconsIcon
						icon={CrownIcon}
						size={20}
						className="text-amber-400 dark:text-amber-300"
					/>
					Weekly Leaderboard
					{liveSince && (
						<span className="ios-caption-3 ml-auto flex items-center gap-1.5 font-medium text-emerald-500 uppercase tracking-wider">
							<span className="relative flex size-2">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
							</span>
							LIVE
						</span>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{entries.length === 0 ? (
					<p className="py-4 text-center text-muted-foreground text-sm">
						No rankings yet. Start studying to appear here!
					</p>
				) : (
					<div className="flex flex-col gap-2">
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
