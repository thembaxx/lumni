"use client";

import { Target01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/shared";

interface TopicCompetency {
	topic: string;
	score: number;
}

interface CompetencyWidgetProps extends React.ComponentProps<typeof Card> {
	subject: string;
	topics: TopicCompetency[];
}

export function CompetencyWidget({
	subject,
	topics,
	className,
	...props
}: CompetencyWidgetProps) {
	const average = topics.length
		? Math.round(topics.reduce((sum, t) => sum + t.score, 0) / topics.length)
		: 0;

	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-heading text-base">
					<HugeiconsIcon
						icon={Target01Icon}
						size={20}
						className="text-primary"
					/>
					{subject} Competency
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground text-sm">Overall</span>
					<span className="font-semibold text-sm">{average}%</span>
				</div>
				<Progress value={average} className="h-2" />
				<div className="space-y-2 pt-2">
					{topics.slice(0, 5).map((topic) => (
						<div
							key={topic.topic}
							className="flex items-center justify-between gap-3"
						>
							<span className="truncate text-xs">{topic.topic}</span>
							<div className="flex w-24 items-center gap-2">
								<Progress value={topic.score} className="h-1.5 flex-1" />
								<span className="w-8 text-right text-muted-foreground text-xs">
									{topic.score}%
								</span>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
