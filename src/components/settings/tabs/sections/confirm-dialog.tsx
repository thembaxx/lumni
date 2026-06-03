"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

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
	return (
		<Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
			<DialogContent className="max-w-sm sm:max-w-sm">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<p className="ios-subhead text-muted-foreground">{description}</p>
				<DialogFooter>
					<Button variant="outline" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button onClick={onConfirm}>{confirmLabel}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
