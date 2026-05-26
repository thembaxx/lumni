"use client";

import { useCallback } from "react";
import { cn } from "@/lib/shared";

const PRESET_EMOJIS = ["👍", "❤️", "😂", "🎉", "💡"];

interface ReactionBarProps {
	reactions: { emoji: string; userId: string; count: number }[];
	currentUserId?: string;
	onToggle: (emoji: string) => void;
	className?: string;
}

export function ReactionBar({
	reactions,
	currentUserId,
	onToggle,
	className,
}: ReactionBarProps) {
	const getCount = useCallback(
		(emoji: string) => reactions.find((r) => r.emoji === emoji)?.count ?? 0,
		[reactions],
	);

	const hasReacted = useCallback(
		(emoji: string) =>
			reactions.some((r) => r.emoji === emoji && r.userId === currentUserId),
		[reactions, currentUserId],
	);

	return (
		<div className={cn("flex flex-wrap items-center gap-1", className)}>
			{PRESET_EMOJIS.map((emoji) => {
				const count = getCount(emoji);
				if (count === 0) return null;
				return (
					<button
						key={emoji}
						type="button"
						onClick={() => onToggle(emoji)}
						className={cn(
							"flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
							hasReacted(emoji)
								? "bg-[--system-accent]/10 text-[--system-accent]"
								: "bg-[--system-surface] text-[--system-text-secondary] hover:bg-[--system-surface-hover]",
						)}
					>
						<span>{emoji}</span>
						{count > 1 && <span>{count}</span>}
					</button>
				);
			})}
			<button
				type="button"
				onClick={() => onToggle("+")}
				className="flex items-center rounded-full px-2 py-0.5 text-[--system-text-tertiary] text-xs transition-colors hover:bg-[--system-surface-hover]"
				title="Add reaction"
			>
				➕
			</button>
		</div>
	);
}
