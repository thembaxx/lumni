"use client";

import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { MasteryBadge } from "@/components/atoms/mastery-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TopicCellData {
	topic: string;
	mastery: "mastered" | "proficient" | "developing" | "novice";
	studentCount: number;
	avgScore: number;
}

interface TopicMasteryHeatmapProps extends React.ComponentProps<typeof Card> {
	topics: TopicCellData[];
}

export function TopicMasteryHeatmap({
	topics,
	className,
	...props
}: TopicMasteryHeatmapProps) {
	return (
		<Card className={cn(className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-base">
					<HugeiconsIcon
						icon={Target01Icon}
						size={20}
						className="text-primary"
					/>
					Topic Mastery Heatmap
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
					{topics.map((t) => (
						<div
							key={t.topic}
							className="flex flex-col items-center gap-1 rounded-lg border bg-muted/30 p-3 text-center"
						>
							<p className="truncate font-medium text-xs">{t.topic}</p>
							<MasteryBadge level={t.mastery} className="text-xs" />
							<p className="text-muted-foreground text-xs">{t.avgScore}% avg</p>
							<p className="text-muted-foreground text-xs">
								{t.studentCount} students
							</p>
						</div>
					))}
					{topics.length === 0 && (
						<p className="col-span-full py-8 text-center text-muted-foreground text-sm">
							No topic data available. Students need to complete quizzes first.
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
