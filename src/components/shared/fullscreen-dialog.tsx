"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/shared";

interface FullscreenDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	badge?: React.ReactNode;
	headerChildren?: React.ReactNode;
	onClose?: () => void;
	className?: string;
	children: React.ReactNode;
}

export function FullscreenDialog({
	open,
	onOpenChange,
	title,
	badge,
	headerChildren,
	onClose,
	className,
	children,
}: FullscreenDialogProps) {
	const handleClose = () => {
		onClose?.();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				showCloseButton={false}
				className={cn(
					"h-dvh max-h-dvh gap-0 overflow-hidden rounded-none p-0",
					className,
				)}
			>
				<div className="flex h-full w-full flex-col">
					<div className="flex shrink-0 items-center gap-2 border-b bg-background px-4 py-3">
						<DialogTitle className="balance flex-1 truncate text-wrap font-semibold text-sm">
							{title}
						</DialogTitle>
						{badge && (
							<Badge
								variant="secondary"
								className="ios-caption-3 shrink-0 px-1.5"
							>
								{badge}
							</Badge>
						)}
						{headerChildren}
						<Button
							variant="ghost"
							size="icon-sm"
							className="shrink-0"
							onClick={handleClose}
							aria-label="Close"
						>
							<HugeiconsIcon icon={Cancel01Icon} />
						</Button>
					</div>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
