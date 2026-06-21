"use client";

import { Button } from "@/components/ui/button";

function RemoveIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="12"
			height="12"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth={1}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<title>Remove</title>
			<path d="M18 6L6 18" />
			<path d="M6 6l12 12" />
		</svg>
	);
}

export function TagChips({
	items,
	selectedIds,
	onRemove,
	emptyMessage,
	ariaLabel,
}: {
	items: { id: string; label: string }[];
	selectedIds: string[];
	onRemove: (id: string) => void;
	emptyMessage: string;
	ariaLabel: string;
}) {
	if (selectedIds.length === 0) {
		return (
			<p className="text-muted-foreground text-xs italic">{emptyMessage}</p>
		);
	}

	return (
		<div className="flex flex-wrap gap-1">
			{selectedIds.flatMap((id) => {
				const item = items.find((i) => i.id === id);
				if (!item) return [];
				return [
					<span key={id} className="rounded bg-accent/20 px-2 py-0.5 text-xs">
						{item.label.substring(0, 20)}...
						<Button
							variant="ghost"
							size="icon"
							onClick={() => onRemove(id)}
							aria-label={ariaLabel}
						>
							<RemoveIcon />
						</Button>
					</span>,
				];
			})}
		</div>
	);
}
