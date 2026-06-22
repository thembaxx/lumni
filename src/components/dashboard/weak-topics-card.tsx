"use client";

import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { competencyService } from "@/lib/competency-engine/competency-service";

interface WeakTopic {
	topicId: string;
	subjectId: string;
	score: number;
}

export function WeakTopicsCard() {
	const { push } = useRouter();

	const { data: subjectsData } = useQuery({
		queryKey: ["subjects"],
		queryFn: async () => {
			const res = await fetch("/api/subjects");
			if (!res.ok) return [];
			const data = await res.json();
			return data.subjects ?? [];
		},
		staleTime: 1000 * 60 * 60,
	});

	const {
		data: weakTopics,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["weak-topics"],
		queryFn: async () => {
			const topics: WeakTopic[] = [];
			for (const s of subjectsData ?? []) {
				const records = await competencyService.getCompetencies(s.id);
				const topicMap = new Map<string, number[]>();
				for (const r of records) {
					const scores = topicMap.get(r.topicId) ?? [];
					scores.push(r.score);
					topicMap.set(r.topicId, scores);
				}
				for (const [topicId, scores] of topicMap) {
					const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
					if (avg < 50) {
						topics.push({ topicId, subjectId: s.id, score: Math.round(avg) });
					}
				}
			}
			return topics.sort((a, b) => a.score - b.score).slice(0, 3);
		},
		enabled: !!subjectsData && subjectsData.length > 0,
		staleTime: 1000 * 60 * 5,
	});

	if (isLoading) {
		return (
			<Card className="overflow-hidden rounded-card shadow-level-1">
				<CardHeader>
					<CardTitle className="font-extrabold text-lg">
						Practice Weak Topics
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 p-5 pt-0">
					<Skeleton className="h-16 w-full rounded-xl" />
					<Skeleton className="h-16 w-full rounded-xl" />
				</CardContent>
			</Card>
		);
	}

	if (isError) {
		return (
			<Card className="overflow-hidden rounded-card shadow-level-1">
				<CardHeader>
					<CardTitle className="font-extrabold text-lg">
						Practice Weak Topics
					</CardTitle>
				</CardHeader>
				<CardContent className="p-5 pt-0">
					<p className="text-muted-foreground text-sm">
						Could not load weak topics.
					</p>
					<Button
						variant="outline"
						size="sm"
						className="mt-2"
						onClick={() => refetch()}
					>
						Try again
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (!weakTopics || weakTopics.length === 0) return null;

	return (
		<div className="card-entrance">
			<Card className="overflow-hidden rounded-card shadow-level-1">
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle className="font-extrabold text-lg">
							Practice Weak Topics
						</CardTitle>
						<HugeiconsIcon
							icon={Target01Icon}
							className="size-5 text-muted-foreground"
							aria-hidden="true"
						/>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-3 p-5 pt-0">
					{weakTopics.map((topic) => (
						<div
							key={`${topic.subjectId}-${topic.topicId}`}
							className="flex items-center justify-between rounded-xl border bg-card p-3"
						>
							<div className="flex min-w-0 flex-col gap-1">
								<div className="flex items-center gap-2">
									<Badge
										variant="outline"
										className="rounded-full px-1.5 py-0 text-[10px]"
									>
										{topic.subjectId}
									</Badge>
									<span className="text-[10px] text-muted-foreground">
										{topic.score}% mastered
									</span>
								</div>
								<span className="truncate text-sm">{topic.topicId}</span>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="shrink-0 text-xs"
								aria-label={`Practice ${topic.topicId}`}
								onClick={() =>
									push(
										`/quiz?subject=${encodeURIComponent(topic.subjectId)}&topic=${encodeURIComponent(topic.topicId)}&count=5`,
									)
								}
							>
								Practice
							</Button>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
