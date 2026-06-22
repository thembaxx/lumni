"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { cva } from "class-variance-authority";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ActivityItem {
	id: string;
	type: "quiz" | "flashcard" | "exam" | "planner";
	description: string;
	timestamp: string;
	subject?: string;
	score?: number;
}

const activityIconVariants = cva(
	"flex size-8 items-center justify-center rounded-lg",
	{
		variants: {
			variant: {
				quiz: "bg-primary/10 text-primary",
				flashcard: "bg-secondary text-secondary-foreground",
				exam: "bg-destructive/10 text-destructive",
				planner: "bg-accent text-accent-foreground",
			},
		},
		defaultVariants: {
			variant: "quiz",
		},
	},
);

interface ActivityTimelineProps extends React.ComponentProps<"div"> {
	items: ActivityItem[];
}

export function ActivityTimeline({
	items,
	className,
	...props
}: ActivityTimelineProps) {
	if (items.length === 0) {
		return (
			<Card
				className={cn(
					"flex flex-col items-center justify-center gap-3 p-8",
					className,
				)}
				{...props}
			>
				<HugeiconsIcon
					icon={BookOpen01Icon}
					size={32}
					className="text-muted-foreground"
				/>
				<p className="text-muted-foreground text-sm">
					No activity recorded this week.
				</p>
			</Card>
		);
	}

	return (
		<Card className={cn("p-4", className)} {...props}>
			<h3 className="mb-4 font-sans font-semibold text-sm tracking-tight">
				Recent Activity
			</h3>
			<ScrollArea className="h-72">
				<div className="relative flex flex-col gap-4 pl-4">
					{items.map((item, index) => (
						<TimelineItem
							key={item.id}
							item={item}
							isLast={index === items.length - 1}
						/>
					))}
				</div>
			</ScrollArea>
		</Card>
	);
}

function TimelineItem({
	item,
	isLast,
}: {
	item: ActivityItem;
	isLast: boolean;
}) {
	return (
		<div className="relative flex gap-3 pb-4">
			{!isLast && (
				<div
					className="absolute top-8 left-4 h-full w-px bg-border"
					aria-hidden="true"
				/>
			)}
			<div
				className={cn(
					activityIconVariants({ variant: item.type }),
					"z-elevated shrink-0",
				)}
			>
				<HugeiconsIcon icon={BookOpen01Icon} size={16} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-medium text-sm">{item.description}</p>
				<div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
					<span>{item.timestamp}</span>
					{item.subject && <span>· {item.subject}</span>}
					{item.score !== undefined && (
						<span
							className={item.score >= 70 ? "text-success" : "text-destructive"}
						>
							· {item.score}%
						</span>
					)}
				</div>
			</div>
		</div>
	);
}
