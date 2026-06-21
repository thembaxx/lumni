"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface Item {
	id: string;
	label: string;
}

export function ItemPickerDialog({
	open,
	onOpenChange,
	title,
	items,
	selectedIds,
	onToggle,
	emptyMessage,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	items: Item[];
	selectedIds: string[];
	onToggle: (id: string) => void;
	emptyMessage: string;
}) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
					{items.length === 0 ? (
						<p className="text-muted-foreground text-xs italic">
							{emptyMessage}
						</p>
					) : (
						items.map((item) => {
							const selected = selectedIds.includes(item.id);
							return (
								<button
									key={item.id}
									type="button"
									onClick={() => onToggle(item.id)}
									className={`flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
										selected ? "bg-accent/20 font-medium" : ""
									}`}
								>
									<input
										type="checkbox"
										checked={selected}
										readOnly
										className="size-4"
									/>
									<span className="truncate">{item.label}</span>
								</button>
							);
						})
					)}
				</div>
				<div className="flex justify-end pt-2">
					<Button size="sm" onClick={() => onOpenChange(false)}>
						Done
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
