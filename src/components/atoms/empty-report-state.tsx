"use client";

import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/shared";

interface EmptyReportStateProps extends React.ComponentProps<typeof Card> {
	actionLabel?: string;
	onAction?: () => void;
}

export function EmptyReportState({
	actionLabel = "Start Studying",
	onAction,
	className,
	...props
}: EmptyReportStateProps) {
	return (
		<Card
			className={cn(
				"flex flex-col items-center justify-center gap-4 border-dashed p-8 text-center",
				className,
			)}
			{...props}
		>
			<CardHeader className="items-center pb-0">
				<div className="flex size-12 items-center justify-center rounded-full bg-muted">
					<HugeiconsIcon
						icon={BookOpen01Icon}
						size={24}
						className="text-muted-foreground"
					/>
				</div>
				<CardTitle className="font-heading text-base">No reports yet</CardTitle>
				<CardDescription className="max-w-xs text-sm">
					Once your child starts studying, their progress will appear here.
				</CardDescription>
			</CardHeader>
			{onAction && (
				<CardContent>
					<Button onClick={onAction} size="sm">
						{actionLabel}
					</Button>
				</CardContent>
			)}
		</Card>
	);
}
