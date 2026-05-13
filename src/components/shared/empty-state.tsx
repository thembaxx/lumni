"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	description?: string;
	action?: React.ReactNode;
	overlay?: boolean;
	className?: string;
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
	overlay,
	className,
}: EmptyStateProps) {
	return (
		<div
			className={cn(
				"flex items-center justify-center h-full",
				overlay && "absolute inset-0 z-20 bg-background/90 backdrop-blur-sm",
				className,
			)}
		>
			<div className="text-center max-w-sm px-6">
				{Icon && (
					<Icon className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
				)}
				<p className="text-sm font-medium text-foreground mb-1">{title}</p>
				{description && (
					<p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
						{description}
					</p>
				)}
				{action && <div className="mt-4">{action}</div>}
			</div>
		</div>
	);
}
