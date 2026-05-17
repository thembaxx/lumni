"use client";

import { useCallback, useEffect, useState } from "react";
import { questionRatingService } from "@/lib/services/question-rating-service";

export function QuestionRatingsDashboard() {
	const [lowRated, setLowRated] = useState<
		Array<{
			questionId: string;
			subject: string;
			avgRating: number;
			count: number;
		}>
	>([]);
	const [stats, setStats] = useState({
		total: 0,
		average: 0,
		counts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
	});
	const [allRatings, setAllRatings] = useState<
		Array<{
			questionId: string;
			subject: string;
			rating: number;
			feedback?: string;
			createdAt: number;
		}>
	>([]);

	const refresh = useCallback(async () => {
		const [low, s, ratings] = await Promise.all([
			questionRatingService.getLowRatedQuestions(),
			questionRatingService.getRatingStats(),
			questionRatingService.getAllRatings(),
		]);
		setLowRated(low);
		setStats(s as typeof stats);
		setAllRatings(ratings.slice(-20).reverse());
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
				<div className="p-4 rounded-2xl border border-border/80 bg-card">
					<p className="text-sm text-muted-foreground">Total Ratings</p>
					<p className="text-2xl font-extrabold">{stats.total}</p>
				</div>
				<div className="p-4 rounded-2xl border border-border/80 bg-card">
					<p className="text-sm text-muted-foreground">Avg Rating</p>
					<p className="text-2xl font-extrabold">{stats.average}</p>
				</div>
				{([1, 2, 3, 4, 5] as const).map((n) => (
					<div
						key={n}
						className="p-4 rounded-2xl border border-border/80 bg-card"
					>
						<p className="text-sm text-muted-foreground">{n} Star</p>
						<p className="text-2xl font-extrabold">{stats.counts[n]}</p>
					</div>
				))}
			</div>

			{lowRated.length > 0 && (
				<div className="rounded-2xl border border-destructive/30 bg-card p-4">
					<h3 className="font-heading text-sm font-medium text-destructive mb-3">
						Low-Rated Questions ({lowRated.length})
					</h3>
					<div className="space-y-2">
						{lowRated.map((q) => (
							<div
								key={q.questionId}
								className="flex items-center justify-between text-sm font-mono"
							>
								<span className="text-muted-foreground truncate max-w-[300px]">
									{q.questionId}
								</span>
								<span className="text-muted-foreground">{q.subject}</span>
								<span className="text-destructive font-bold">
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
				<h3 className="font-heading text-sm font-medium mb-3">
					Recent Ratings
				</h3>
				{allRatings.length === 0 ? (
					<p className="text-sm text-muted-foreground">No ratings yet</p>
				) : (
					<div className="space-y-1 max-h-60 overflow-y-auto">
						{allRatings.map((r, i) => (
							<div
								key={i}
								className="flex items-center gap-2 text-xs font-mono"
							>
								<span className="text-amber-500 font-bold">{r.rating}/5</span>
								<span className="text-muted-foreground truncate max-w-[200px]">
									{r.questionId}
								</span>
								<span className="text-muted-foreground">{r.subject}</span>
								{r.feedback && (
									<span className="text-muted-foreground truncate max-w-[200px]">
										"{r.feedback}"
									</span>
								)}
								<span className="text-muted-foreground ml-auto">
									{new Date(r.createdAt).toLocaleDateString()}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
