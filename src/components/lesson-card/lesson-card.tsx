import { Dice5 } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDifficultyColor } from "@/components/study-topic-card/study-topic-card.data";

export interface LessonCardData {
	id: string;
	subject: string;
	difficulty: "easy" | "medium" | "hard";
	title: string;
	summary: string;
}

export function LessonCard({
	subject,
	difficulty,
	title,
	summary,
}: LessonCardData) {
	return (
		<Card className="p-5 rounded-2xl border bg-card text-card-foreground shadow-sm hover:border-primary/20 transition-all duration-200">
			{/* Header badges */}
			<div className="flex justify-between items-start">
				<Badge
					variant="outline"
					className="px-3 py-0.5 text-xs font-medium rounded-full"
				>
					{subject}
				</Badge>
				<Badge
					className={cn(
						"px-3 py-0.5 text-[10px] uppercase font-medium bg-primary/10 rounded-full",
						getDifficultyColor(difficulty),
					)}
				>
					{difficulty}
				</Badge>
			</div>

			{/* Lesson title */}
			<h3 className="text-lg font-semibold leading-tight text-foreground text-wrap balance">
				{title}
			</h3>

			{/* Summary with 2 line clamp */}
			<p className="text-sm text-muted-foreground leading-relaxed text-pretty line-clamp-2">
				{summary}
			</p>

			{/* Action buttons */}
			<div className="flex gap-2 justify-between items-center pt-1">
				<Button
					size="sm"
					variant="outline"
					className="h-8 px-3 text-xs rounded-lg active:scale-[0.96] transition-transform"
				>
					View Lesson
				</Button>
				<Button
					size="sm"
					variant="ghost"
					className="h-8 px-3 text-xs rounded-lg active:scale-[0.96] transition-transform"
				>
					<HugeiconsIcon icon={Dice5} className="h-4 w-4" />
				</Button>
			</div>
		</Card>
	);
}
