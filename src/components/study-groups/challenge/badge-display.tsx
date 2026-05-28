"use client";

import { Award01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/shared";
import type { GroupBadge } from "@/lib/study-groups/challenge-types";

interface BadgeDisplayProps {
	badges: GroupBadge[];
	max?: number;
	size?: "sm" | "md";
}

const tierConfig = {
	bronze: { bg: "bg-amber-100 text-amber-800", ring: "ring-amber-400" },
	silver: { bg: "bg-slate-100 text-slate-700", ring: "ring-slate-400" },
	gold: { bg: "bg-yellow-100 text-yellow-800", ring: "ring-yellow-400" },
} as const;

export function BadgeDisplay({
	badges,
	max = 3,
	size = "sm",
}: BadgeDisplayProps) {
	if (badges.length === 0) return null;

	const visible = badges.slice(0, max);
	const remaining = badges.length - max;

	return (
		<div className="flex items-center gap-1">
			{visible.map((badge) => (
				<span
					key={badge.$id || `${badge.name}-${badge.userId}`}
					title={`${badge.name}: ${badge.description}`}
					className={cn(
						"inline-flex items-center justify-center rounded-full ring-1",
						tierConfig[badge.tier].bg,
						tierConfig[badge.tier].ring,
						size === "sm" ? "size-5 text-[10px]" : "size-7 text-sm",
					)}
				>
					{badge.icon || (
						<HugeiconsIcon icon={Award01Icon} className="size-3" />
					)}
				</span>
			))}
			{remaining > 0 && (
				<span
					className={cn(
						"text-muted-foreground",
						size === "sm" ? "text-[10px]" : "text-xs",
					)}
				>
					+{remaining}
				</span>
			)}
		</div>
	);
}
