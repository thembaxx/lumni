"use client";

import type { Icon } from "@phosphor-icons/react";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/shared";

interface EmptyStateProps {
	icon?: Icon;
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
			<Empty>
				<EmptyHeader>
					{Icon && (
						<Icon className="size-10 mx-auto text-muted-foreground/30" />
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
