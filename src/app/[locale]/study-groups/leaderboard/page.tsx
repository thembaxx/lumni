"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
	groupId: string;
	groupName: string;
	totalScore: number;
	memberCount: number;
}

const medalIcons = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["group-leaderboard"],
		queryFn: async () => {
			const res = await fetch("/api/study-groups/leaderboard");
			if (!res.ok) throw new Error("Failed to fetch");
			const body = (await res.json()) as { leaderboard: LeaderboardEntry[] };
			return body.leaderboard.sort((a, b) => b.totalScore - a.totalScore);
		},
		refetchInterval: 60_000,
	});

	return (
		<PageContainer>
			<div className="flex flex-col gap-6 py-6">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						asChild
						aria-label="Back to study groups"
					>
						<Link href="/study-groups">
							<HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
						</Link>
					</Button>
					<div>
						<h1 className="font-bold text-2xl">Group Leaderboard</h1>
						<p className="text-muted-foreground text-sm">
							This week&apos;s inter-group competition
						</p>
					</div>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<HugeiconsIcon
								icon={Award01Icon}
								className="size-5 text-warning"
							/>
							Weekly Rankings
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isError ? (
							<p className="py-8 text-center text-destructive text-sm">
								Failed to load leaderboard: {error?.message}
							</p>
						) : isLoading ? (
							<div className="flex flex-col gap-3">
								{[1, 2, 3].map((i) => (
									<Skeleton key={i} className="h-16 w-full rounded-xl" />
								))}
							</div>
						) : !data || data.length === 0 ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								No active challenges this week.
							</p>
						) : (
							<div className="flex flex-col gap-2">
								{data.map((entry, i) => (
									<Link
										key={entry.groupId}
										href={`/study-groups/${entry.groupId}`}
										className={cn(
											"flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-muted/50",
											i === 0 && "bg-warning/5",
										)}
									>
										<span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-bold text-sm">
											{i < 3 ? medalIcons[i] : `#${i + 1}`}
										</span>
										<div className="min-w-0 flex-1">
											<p className="truncate font-semibold text-sm">
												{entry.groupName}
											</p>
											<p className="text-muted-foreground text-xs">
												{entry.memberCount} members
											</p>
										</div>
										<div className="text-right">
											<p className="font-bold tabular-nums">
												{Math.round(entry.totalScore)}
											</p>
											<p className="text-muted-foreground text-xs">pts</p>
										</div>
									</Link>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</PageContainer>
	);
}
