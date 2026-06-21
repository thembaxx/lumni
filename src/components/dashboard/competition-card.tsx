"use client";

import { ArrowRight01Icon, Award01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getLeaderboard, getTimeRemaining } from "@/lib/competitions/service";

const MEDALS = ["🥇", "🥈", "🥉"];

export function CompetitionCard() {
	const _t = useTranslations();
	const { user } = useAuth();
	const userId = user?.$id ?? "";

	const { data: leaderboard, isLoading } = useQuery({
		queryKey: ["competition-leaderboard"],
		queryFn: getLeaderboard,
		refetchInterval: 60000,
	});

	const myRank = useMemo(
		() =>
			userId ? (leaderboard?.find((e) => e.userId === userId) ?? null) : null,
		[leaderboard, userId],
	);

	const timeLeft = getTimeRemaining();

	if (isLoading) {
		return (
			<Card className="flex flex-col gap-3 p-4">
				<Skeleton className="h-5 w-32" />
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-10 w-full" />
			</Card>
		);
	}

	const top3 = leaderboard?.slice(0, 3) ?? [];
	const rankText = myRank
		? `#${myRank.rank}`
		: leaderboard && leaderboard.length > 0
			? `#${leaderboard.length + 1}`
			: "--";

	return (
		<Link href="/study-groups">
			<Card className="group flex flex-col gap-3 p-4 transition-[background-color] duration-300 active:scale-[0.98]">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={Award01Icon} className="size-5 text-warning" />
						<h3 className="font-semibold text-sm">Weekly Competition</h3>
					</div>
					<HugeiconsIcon
						icon={ArrowRight01Icon}
						className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
					/>
				</div>

				<div className="flex items-center justify-between text-sm">
					<span className="text-muted-foreground">
						{timeLeft.days > 0
							? `${timeLeft.days}d ${timeLeft.hours}h remaining`
							: `${timeLeft.hours}h remaining`}
					</span>
					<span className="font-medium tabular-nums">{rankText}</span>
				</div>

				{top3.length > 0 && (
					<div className="grid grid-cols-3 gap-2">
						{top3.map((entry, i) => (
							<div
								key={entry.userId}
								className="flex flex-col items-center gap-0.5 rounded-lg bg-muted/40 px-2 py-1.5"
							>
								<span className="text-base">{MEDALS[i]}</span>
								<span className="max-w-full truncate font-mono text-xs">
									{entry.xpEarned} XP
								</span>
							</div>
						))}
					</div>
				)}

				{(!leaderboard || leaderboard.length === 0) && (
					<p className="text-muted-foreground text-xs">
						Complete quizzes to earn XP and climb the leaderboard!
					</p>
				)}
			</Card>
		</Link>
	);
}
