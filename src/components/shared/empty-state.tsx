"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/shared";

interface EmptyStateProps {
	icon?: IconSvgElement;
	title: string;
	description?: string;
	action?: React.ReactNode;
	overlay?: boolean;
	className?: string;
}

export function EmptyState({
	icon,
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
			<Empty>
				<EmptyHeader>
					{icon && (
						<HugeiconsIcon
							icon={icon}
							className="size-10 mx-auto text-muted-foreground/30"
						/>
					)}
					<EmptyTitle>{title}</EmptyTitle>
				</EmptyHeader>
				<EmptyContent>
					{description && <EmptyDescription>{description}</EmptyDescription>}
					{action && action}
				</EmptyContent>
			</Empty>
		</div>
	);
}
