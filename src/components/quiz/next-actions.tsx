"use client";

import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import TargetIcon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { competencyService } from "@/lib/competency-engine";
import { flashcardEngine } from "@/lib/flashcard-engine";

interface NextActionsProps {
	subject: string;
	correctness: boolean[];
	totalQuestions: number;
	onPracticeTopic?: (topic: string) => void;
}

export function NextActions({
	subject,
	correctness,
	totalQuestions,
	onPracticeTopic,
}: NextActionsProps) {
	const { push } = useNavigationDirection();
	const { data, isError, error } = useQuery({
		queryKey: ["next-actions", subject.toLowerCase()],
		queryFn: async () => {
			const [dueCards, competencies] = await Promise.all([
				flashcardEngine.getDueCards(),
				competencyService.getCompetencies(subject.toLowerCase()),
			]);
			let weakestTopic: string | null = null;
			let weakestScore: number | null = null;
			if (competencies.length > 0) {
				const weakest = competencies.reduce((prev, curr) =>
					curr.score < prev.score ? curr : prev,
				);
				weakestTopic = weakest.topicId;
				weakestScore = Math.round(weakest.score);
			}
			return { dueCount: dueCards.length, weakestTopic, weakestScore };
		},
	});

	const dueCount = data?.dueCount ?? 0;
	const weakestTopic = data?.weakestTopic ?? null;
	const weakestScore = data?.weakestScore ?? null;

	const wrongCount = totalQuestions - correctness.filter(Boolean).length;
	if (isError) {
		return (
			<div className="flex flex-col gap-2 rounded-lg border border-destructive/60 bg-destructive/5 p-4">
				<p className="text-destructive text-xs">
					Failed to load next steps: {error?.message}
				</p>
			</div>
		);
	}
	if (dueCount === 0 && weakestTopic === null && wrongCount === 0) return null;

	return (
		<div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
			<p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
				Next Steps
			</p>
			<div className="flex flex-col gap-2">
				{dueCount > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-auto justify-start gap-2 py-2"
						onClick={() => push("/flashcards")}
					>
						<HugeiconsIcon icon={FlashIcon} className="size-4" />
						<span className="text-xs">
							{dueCount} flashcards due for review
						</span>
					</Button>
				)}
				{weakestTopic && (
					<Button
						variant="ghost"
						size="sm"
						className="h-auto justify-start gap-2 py-2"
						onClick={() => {
							if (onPracticeTopic) {
								onPracticeTopic(weakestTopic);
							} else {
								push(
									`/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(weakestTopic)}&count=10`,
								);
							}
						}}
					>
						<HugeiconsIcon icon={TargetIcon} className="size-4" />
						<span className="text-xs">
							Practice {weakestTopic} ({weakestScore}%)
						</span>
					</Button>
				)}
				{wrongCount > 0 && (
					<Button
						variant="ghost"
						size="sm"
						className="h-auto justify-start gap-2 py-2"
						onClick={() => push("/review")}
					>
						<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
						<span className="text-xs">Review {wrongCount} wrong answers</span>
					</Button>
				)}
			</div>
		</div>
	);
}
