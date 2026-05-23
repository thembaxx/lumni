"use client";

import { Calendar03Icon } from "@hugeicons/core-free-icons";
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

interface SessionPreview {
	id: string;
	subject: string;
	topic: string;
	duration: number;
	completed: boolean;
}

interface PlannerPreviewProps extends React.ComponentProps<typeof Card> {
	sessions: SessionPreview[];
	onViewPlan: () => void;
}

export function PlannerPreview({
	sessions,
	onViewPlan,
	className,
	...props
}: PlannerPreviewProps) {
	const completed = sessions.filter((s) => s.completed).length;
	const total = sessions.length;

	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-heading text-base">
					<HugeiconsIcon
						icon={Calendar03Icon}
						size={20}
						className="text-primary"
					/>
					Today&apos;s Plan
				</CardTitle>
				<CardDescription>
					{completed} / {total} sessions completed
				</CardDescription>
			</CardHeader>
			<CardContent className="flex flex-col gap-3">
				{sessions.length === 0 && (
					<p className="text-muted-foreground text-sm">
						No sessions scheduled for today.
					</p>
				)}
				{sessions.map((session) => (
					<div
						key={session.id}
						className="flex items-center justify-between rounded-lg bg-muted/50 p-2"
					>
						<div>
							<p className="font-medium text-sm">{session.subject}</p>
							<p className="text-muted-foreground text-xs">{session.topic}</p>
						</div>
						<span
							className={`font-medium text-xs ${
								session.completed ? "text-success" : "text-muted-foreground"
							}`}
						>
							{session.completed ? "Done" : `${session.duration} min`}
						</span>
					</div>
				))}
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={onViewPlan}
				>
					View Full Plan
				</Button>
			</CardContent>
		</Card>
	);
}
