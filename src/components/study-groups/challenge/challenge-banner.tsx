"use client";

import type {
	GroupChallenge,
	GroupChallengeEntry,
} from "@/lib/study-groups/challenge-types";

interface Props {
	challenge: GroupChallenge;
	entries: GroupChallengeEntry[];
}

export function ChallengeBanner({ challenge, entries }: Props) {
	const now = Date.now();
	const weekEnd = new Date(challenge.weekEnd).getTime();
	const daysLeft = Math.max(
		0,
		Math.ceil((weekEnd - now) / (1000 * 60 * 60 * 24)),
	);
	const totalScore = entries.reduce((s, e) => s + e.combinedScore, 0);
	const memberCount = entries.length;

	const weekLabel = (() => {
		const start = new Date(challenge.weekStart);
		const end = new Date(challenge.weekEnd);
		return `${start.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}`;
	})();

	return (
		<div className="rounded-xl border border-[--system-accent]/20 bg-[--system-accent]/5 p-4">
			<div className="mb-2 flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="text-lg">🏆</span>
					<div>
						<p className="font-semibold text-sm">Weekly Challenge</p>
						<p className="text-muted-foreground text-xs">{weekLabel}</p>
					</div>
				</div>
				<span className="font-mono text-muted-foreground text-xs">
					{daysLeft > 0 ? `${daysLeft}d remaining` : "Final day"}
				</span>
			</div>
			<div className="mt-3 flex items-center gap-4">
				<div className="flex-1">
					<div className="mb-1 flex justify-between text-muted-foreground text-xs">
						<span>Group score</span>
						<span>{Math.round(totalScore)} pts</span>
					</div>
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-[--system-accent] transition-all"
							style={{ width: `${Math.min(totalScore, 100)}%` }}
						/>
					</div>
				</div>
				<div className="text-right">
					<p className="font-bold text-lg">{memberCount}</p>
					<p className="ios-caption-3 text-muted-foreground leading-tight">
						members
					</p>
				</div>
			</div>
		</div>
	);
}
