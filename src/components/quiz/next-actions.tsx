"use client";

import {
	BookOpen01Icon,
	FlashIcon,
	TargetIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { competencyService } from "@/lib/competency-engine";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { logError } from "@/lib/shared/logger";

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
	const [dueCount, setDueCount] = useState(0);
	const [weakestTopic, setWeakestTopic] = useState<string | null>(null);
	const [weakestScore, setWeakestScore] = useState<number | null>(null);

	const loadData = useCallback(async () => {
		try {
			const [dueCards, competencies] = await Promise.all([
				flashcardEngine.getDueCards(),
				competencyService.getCompetencies(subject.toLowerCase()),
			]);
			setDueCount(dueCards.length);
			if (competencies.length > 0) {
				const weakest = competencies.reduce((prev, curr) =>
					curr.score < prev.score ? curr : prev,
				);
				setWeakestTopic(weakest.topicId);
				setWeakestScore(Math.round(weakest.score));
			}
		} catch (err) {
			logError("NextActionsLoad", err);
		}
	}, [subject]);

	useEffect(() => {
		loadData();
	}, [loadData]);

	const wrongCount = totalQuestions - correctness.filter(Boolean).length;
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
						onClick={() => (window.location.href = "/flashcards")}
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
								window.location.href = `/quiz?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(weakestTopic)}&count=10`;
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
						onClick={() => (window.location.href = "/review")}
					>
						<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
						<span className="text-xs">Review {wrongCount} wrong answers</span>
					</Button>
				)}
			</div>
		</div>
	);
}
