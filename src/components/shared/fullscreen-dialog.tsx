"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
					"max-w-[100vw] h-dvh max-h-dvh p-0 gap-0 rounded-none overflow-hidden",
					className,
				)}
			>
				<div className="flex flex-col h-full w-full">
					<div className="flex items-center gap-2 px-4 py-3 border-b shrink-0 bg-background">
						<h2 className="text-sm font-semibold truncate text-wrap balance flex-1">
							{title}
						</h2>
						{badge && (
							<Badge
								variant="secondary"
								className="text-[10px] px-1.5 shrink-0"
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
							<HugeiconsIcon icon={Cancel01Icon} className="size-4" />
						</Button>
					</div>
					{children}
				</div>
			</DialogContent>
		</Dialog>
	);
}
