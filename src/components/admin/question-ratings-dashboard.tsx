"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { questionRatingService } from "@/lib/services/question-rating-service";

export function QuestionRatingsDashboard() {
	const [mounted] = useState(true);
	const { data: lowRated = [] } = useQuery({
		queryKey: ["question-ratings", "low-rated"],
		queryFn: async () => {
			const result = await questionRatingService.getLowRatedQuestions();
			return result.success ? result.data : [];
		},
	});

	const {
		data: stats = {
			total: 0,
			average: 0,
			counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
		},
	} = useQuery({
		queryKey: ["question-ratings", "stats"],
		queryFn: async () => {
			const result = await questionRatingService.getRatingStats();
			return result.success
				? result.data
				: { total: 0, average: 0, counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
		},
	});

	const { data: allRatings = [] } = useQuery({
		queryKey: ["question-ratings", "recent"],
		queryFn: async () => {
			const result = await questionRatingService.getAllRatings();
			return result.success ? result.data.slice(-20).reverse() : [];
		},
	});

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
				<div className="rounded-2xl border border-border/80 bg-card p-4">
					<p className="text-muted-foreground text-sm">Total Ratings</p>
					<p className="font-extrabold text-2xl">{stats.total}</p>
				</div>
				<div className="rounded-2xl border border-border/80 bg-card p-4">
					<p className="text-muted-foreground text-sm">Avg Rating</p>
					<p className="font-extrabold text-2xl">{stats.average}</p>
				</div>
				{([1, 2, 3, 4, 5] as const).map((n) => (
					<div
						key={n}
						className="rounded-2xl border border-border/80 bg-card p-4"
					>
						<p className="text-muted-foreground text-sm">{n} Star</p>
						<p className="font-extrabold text-2xl">{stats.counts[n]}</p>
					</div>
				))}
			</div>

			{lowRated.length > 0 && (
				<div className="rounded-2xl border border-destructive/30 bg-card p-4">
					<h3 className="mb-3 font-heading font-medium text-destructive text-sm">
						Low-Rated Questions ({lowRated.length})
					</h3>
					<div className="flex flex-col gap-2">
						{lowRated.map((q) => (
							<div
								key={q.questionId}
								className="flex items-center justify-between font-mono text-sm"
							>
								<span className="max-w-[300px] truncate text-muted-foreground">
									{q.questionId}
								</span>
								<span className="text-muted-foreground">{q.subject}</span>
								<span className="font-bold text-destructive">
									{q.avgRating}
								</span>
								<span className="text-muted-foreground">
									({q.count} ratings)
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="rounded-2xl border border-border/80 bg-card p-4">
				<h3 className="mb-3 font-heading font-medium text-sm">
					Recent Ratings
				</h3>
				{allRatings.length === 0 ? (
					<p className="text-muted-foreground text-sm">No ratings yet</p>
				) : (
					<div className="flex max-h-60 flex-col gap-1 overflow-y-auto">
						{allRatings.map((r) => (
							<div
								key={`${r.questionId}-${r.createdAt}`}
								className="flex items-center gap-2 font-mono text-xs"
							>
								<span className="font-bold text-amber-500">{r.rating}/5</span>
								<span className="max-w-48 truncate text-muted-foreground">
									{r.questionId}
								</span>
								<span className="text-muted-foreground">{r.subject}</span>
								{r.feedback && (
									<span className="max-w-48 truncate text-muted-foreground">
										"{r.feedback}"
									</span>
								)}
								<span className="ml-auto text-muted-foreground">
									{mounted ? new Date(r.createdAt).toLocaleDateString() : ""}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
