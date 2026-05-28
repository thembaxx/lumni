"use client";

import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
	open: boolean;
	title: string;
	description: string;
	confirmLabel: string;
	cancelLabel?: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export function ConfirmDialog({
	open,
	title,
	description,
	confirmLabel,
	cancelLabel = "Cancel",
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-modal flex items-center justify-center bg-black/40">
			<div className="mx-4 w-full max-w-sm rounded-2xl bg-card p-6 shadow-level-3">
				<h3 className="ios-title-3 mb-2 font-semibold">{title}</h3>
				<p className="ios-subhead mb-6 text-muted-foreground">{description}</p>
				<div className="flex justify-end gap-3">
					<Button variant="outline" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button onClick={onConfirm}>{confirmLabel}</Button>
				</div>
			</div>
		</div>
	);
}
