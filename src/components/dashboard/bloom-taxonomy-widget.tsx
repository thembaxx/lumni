"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { competencyService } from "@/lib/competency-engine";
import type { CompetencyLevel } from "@/lib/competency-engine/types";
import type { BloomLevel } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";

const BLOOM_ORDER: BloomLevel[] = [
	"remember",
	"understand",
	"apply",
	"analyze",
	"evaluate",
	"create",
];

const BLOOM_LABELS: Record<BloomLevel, string> = {
	remember: "Recall",
	understand: "Explain",
	apply: "Apply",
	analyze: "Analyze",
	evaluate: "Evaluate",
	create: "Create",
};

const COMPETENCY_COLORS: Record<CompetencyLevel, string> = {
	novice: "bg-destructive/20 text-destructive",
	developing: "bg-warning/20 text-warning",
	proficient: "bg-success/20 text-success",
	mastered: "bg-[--system-accent]/20 text-[--system-accent]",
};

const LEVEL_RECOMMENDATIONS: Record<
	CompetencyLevel,
	{ format: string; description: string }
> = {
	novice: {
		format: "Flashcards + Summaries",
		description: "Focus on memorising key facts and terms",
	},
	developing: {
		format: "Practice Quizzes",
		description: "Test your understanding with guided questions",
	},
	proficient: {
		format: "Past Papers + Problems",
		description: "Apply knowledge to exam-style questions",
	},
	mastered: {
		format: "Teach + Create",
		description: "Create study sets or explain to peers",
	},
};

export function BloomTaxonomyWidget() {
	const [topicData, setTopicData] = useState<
		{
			topicId: string;
			levels: Record<BloomLevel, number>;
			overall: CompetencyLevel | null;
		}[]
	>([]);

	const load = useCallback(async () => {
		const competencies = await competencyService.getCompetencies("");
		const grouped: Record<string, CompetencyLevel[]> = {};
		const scores: Record<string, Record<string, number>> = {};

		for (const c of competencies) {
			if (!c.subjectId || !c.topicId) continue;
			const key = `${c.subjectId}::${c.topicId}`;
			if (!grouped[key]) grouped[key] = [];
			if (!scores[key]) scores[key] = {};
			grouped[key].push(c.level);
			scores[key][c.bloomLevel] = c.score;
		}

		const result = Object.entries(grouped).map(([key, _levels]) => {
			const [, topicId] = key.split("::");
			const totalScores = Object.values(scores[key] ?? {});
			const avgScore =
				totalScores.length > 0
					? totalScores.reduce((a, b) => a + b, 0) / totalScores.length
					: 0;
			const overall: CompetencyLevel =
				avgScore >= 80
					? "mastered"
					: avgScore >= 60
						? "proficient"
						: avgScore >= 40
							? "developing"
							: "novice";
			const levelScores = scores[key] ?? {};
			return {
				topicId,
				levels: Object.fromEntries(
					BLOOM_ORDER.map((bl) => [bl, levelScores[bl] ?? 0]),
				) as Record<BloomLevel, number>,
				overall,
			};
		});

		setTopicData(result);
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	if (topicData.length === 0) return null;

	return (
		<Card className="rounded-[2rem] shadow-level-1">
			<CardHeader>
				<CardTitle className="font-semibold text-base">
					Bloom's Taxonomy Progress
				</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-4">
				{topicData.slice(0, 4).map((topic) => (
					<div key={topic.topicId} className="rounded-[1rem] bg-muted/40 p-3">
						<div className="mb-2 flex items-center justify-between">
							<p className="font-medium text-sm capitalize">
								{topic.topicId.replace(/-/g, " ")}
							</p>
							{topic.overall && (
								<span
									className={cn(
										"rounded-full px-2 py-0.5 font-medium text-[10px]",
										COMPETENCY_COLORS[topic.overall],
									)}
								>
									{topic.overall}
								</span>
							)}
						</div>
						<div className="mb-2 flex gap-1">
							{BLOOM_ORDER.map((bl) => {
								const score = topic.levels[bl];
								const fill =
									score >= 80
										? "bg-[--system-accent]"
										: score >= 50
											? "bg-[--system-accent]/50"
											: "bg-muted-foreground/20";
								return (
									<div
										key={bl}
										className="flex flex-1 flex-col items-center gap-1"
									>
										<div className="h-12 w-full overflow-hidden rounded-md bg-muted">
											<div
												className={cn(
													"h-full w-full rounded-md transition-[height]",
													fill,
												)}
												style={{ height: `${Math.max(8, score)}%` }}
											/>
										</div>
										<span className="text-[9px] text-muted-foreground uppercase">
											{BLOOM_LABELS[bl].slice(0, 3)}
										</span>
									</div>
								);
							})}
						</div>
						{topic.overall && (
							<p className="text-[10px] text-muted-foreground">
								Recommended:{" "}
								<span className="font-medium text-foreground">
									{LEVEL_RECOMMENDATIONS[topic.overall].format}
								</span>{" "}
								- {LEVEL_RECOMMENDATIONS[topic.overall].description}
							</p>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	);
}
