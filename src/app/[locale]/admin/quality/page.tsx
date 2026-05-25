"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { QuestionRatingsDashboard } from "@/components/admin/question-ratings-dashboard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/shared";
import {
	clearAnalytics,
	getAnalyticsSummary,
	loadEvents,
} from "@/lib/utils/engine-analytics";
import {
	clearQualityRecords,
	getQualityStats,
	loadQualityRecords,
} from "@/lib/utils/engine-quality";

function Timestamp({ time }: { time: string | number }) {
	const [label, setLabel] = useState("");

	useEffect(() => {
		setLabel(new Date(time).toLocaleTimeString());
	}, [time]);

	return (
		<span className={cn("text-muted-foreground")}>{label || "Loading..."}</span>
	);
}

export default function AdminQualityPage() {
	const { data: quality = getQualityStats() } = useQuery({
		queryKey: ["engine-quality", "stats"],
		queryFn: () => getQualityStats(),
		refetchInterval: 5000,
	});

	const { data: analytics = getAnalyticsSummary() } = useQuery({
		queryKey: ["engine-quality", "analytics-summary"],
		queryFn: () => getAnalyticsSummary(),
		refetchInterval: 5000,
	});

	const { data: events = loadEvents().slice(-20).reverse() } = useQuery({
		queryKey: ["engine-quality", "events"],
		queryFn: () => loadEvents().slice(-20).reverse(),
		refetchInterval: 5000,
	});

	const { data: recentQuality = loadQualityRecords().slice(-10).reverse() } =
		useQuery({
			queryKey: ["engine-quality", "recent"],
			queryFn: () => loadQualityRecords().slice(-10).reverse(),
			refetchInterval: 5000,
		});

	const queryClient = useQueryClient();

	const handleClear = useCallback(() => {
		clearAnalytics();
		clearQualityRecords();
		queryClient.invalidateQueries({ queryKey: ["engine-quality"] });
	}, [queryClient]);

	return (
		<div
			className={cn(
				"flex",
				"flex-col",
				"min-h-dvh",
				"mx-auto",
				"max-w-5xl",
				"bg-background",
				"p-6",
				"gap-6",
			)}
		>
			<div className={cn("flex", "items-center", "justify-between")}>
				<h1 className={cn("font-extrabold", "text-2xl")}>
					Engine Quality & Analytics
				</h1>
				<Button variant="outline" size="sm" onClick={handleClear}>
					Clear Data
				</Button>
			</div>

			<div className={cn("grid", "grid-cols-2", "gap-4", "lg:grid-cols-4")}>
				<div
					className={cn(
						"overflow-hidden",
						"rounded-card-lg",
						"border",
						"border-border/80",
						"bg-card",
						"shadow-level-2",
						"transition-colors",
					)}
				>
					<header
						className={cn(
							"rounded-t-card-lg",
							"border-t",
							"border-border/80",
							"p-4",
							"pb-2",
						)}
					>
						<h2
							className={cn(
								"font-heading",
								"font-medium",
								"text-sm",
								"text-muted-foreground",
							)}
						>
							Total Requests
						</h2>
					</header>
					<div className={cn("group-data-[size=sm]/card:px-3", "p-4", "pt-0")}>
						<p className={cn("font-extrabold", "text-3xl")}>
							{analytics.totalRequests}
						</p>
					</div>
				</div>
				<div
					className={cn(
						"overflow-hidden",
						"rounded-card-lg",
						"border",
						"border-border/80",
						"bg-card",
						"shadow-level-2",
						"transition-colors",
					)}
				>
					<header
						className={cn(
							"rounded-t-card-lg",
							"border-t",
							"border-border/80",
							"p-4",
							"pb-2",
						)}
					>
						<h2
							className={cn(
								"font-heading",
								"font-medium",
								"text-sm",
								"text-muted-foreground",
							)}
						>
							Success Rate
						</h2>
					</header>
					<div className={cn("group-data-[size=sm]/card:px-3", "p-4", "pt-0")}>
						<p
							className={cn(
								"text-3xl",
								"font-extrabold",
								analytics.successRate >= 80
									? "text-success"
									: analytics.successRate >= 50
										? "text-warning"
										: "text-destructive",
							)}
						>
							{analytics.successRate}%
						</p>
					</div>
				</div>
				<div
					className={cn(
						"overflow-hidden",
						"rounded-card-lg",
						"border",
						"border-border/80",
						"bg-card",
						"shadow-level-2",
						"transition-colors",
					)}
				>
					<header
						className={cn(
							"rounded-t-card-lg",
							"border-t",
							"border-border/80",
							"p-4",
							"pb-2",
						)}
					>
						<h2
							className={cn(
								"font-heading",
								"font-medium",
								"text-sm",
								"text-muted-foreground",
							)}
						>
							Avg Validation Score
						</h2>
					</header>
					<div className={cn("group-data-[size=sm]/card:px-3", "p-4", "pt-0")}>
						<p
							className={cn(
								"text-3xl",
								"font-extrabold",
								quality.avgScore >= 80
									? "text-success"
									: quality.avgScore >= 50
										? "text-warning"
										: "text-destructive",
							)}
						>
							{quality.avgScore}
						</p>
					</div>
				</div>
				<div
					className={cn(
						"overflow-hidden",
						"rounded-card-lg",
						"border",
						"border-border/80",
						"bg-card",
						"shadow-level-2",
						"transition-colors",
					)}
				>
					<header
						className={cn(
							"rounded-t-card-lg",
							"border-t",
							"border-border/80",
							"p-4",
							"pb-2",
						)}
					>
						<h2
							className={cn(
								"font-heading",
								"font-medium",
								"text-sm",
								"text-muted-foreground",
							)}
						>
							Question Pass Rate
						</h2>
					</header>
					<div className={cn("group-data-[size=sm]/card:px-3", "p-4", "pt-0")}>
						<p
							className={cn(
								"text-3xl",
								"font-extrabold",
								quality.passRate >= 80
									? "text-success"
									: quality.passRate >= 50
										? "text-warning"
										: "text-destructive",
							)}
						>
							{quality.passRate}%
						</p>
					</div>
				</div>
			</div>

			<div className={cn("grid", "grid-cols-2", "gap-6")}>
				<div
					className={cn(
						"overflow-hidden",
						"rounded-card-lg",
						"border",
						"border-border/80",
						"bg-card",
						"shadow-level-2",
						"transition-colors",
					)}
				>
					<header>
						<h2 className={cn("font-heading", "text-lg", "font-medium")}>
							Requests Breakdown
						</h2>
					</header>
					<div
						className={cn(
							"flex",
							"flex-col",
							"group-data-[size=sm]/card:px-3",
							"px-4",
							"gap-3",
						)}
					>
						<div className={cn("flex", "justify-between", "text-sm")}>
							<span>Generate</span>
							<span className={cn("font-mono")}>{analytics.generateCount}</span>
						</div>
						<div className={cn("flex", "justify-between", "text-sm")}>
							<span>Grade</span>
							<span className={cn("font-mono")}>{analytics.gradeCount}</span>
						</div>
						<div className={cn("flex", "justify-between", "text-sm")}>
							<span>Hint</span>
							<span className={cn("font-mono")}>{analytics.hintCount}</span>
						</div>
					</div>
				</div>

				<div
					className={cn(
						"overflow-hidden",
						"rounded-card-lg",
						"border",
						"border-border/80",
						"bg-card",
						"shadow-level-2",
						"transition-colors",
					)}
				>
					<header>
						<h2 className={cn("font-heading", "text-lg", "font-medium")}>
							Quality by Type
						</h2>
					</header>
					<div
						className={cn(
							"flex",
							"flex-col",
							"group-data-[size=sm]/card:px-3",
							"px-4",
							"gap-2",
						)}
					>
						{Object.entries(quality.byType).length === 0 && (
							<p className={cn("text-sm", "text-muted-foreground")}>
								No quality data yet
							</p>
						)}
						{(
							Object.entries(quality.byType) as [
								string,
								{ count: number; avgScore: number },
							][]
						).map(([type, stats]) => (
							<div
								key={type}
								className={cn(
									"flex",
									"items-center",
									"justify-between",
									"text-sm",
								)}
							>
								<Badge variant="outline" className={cn("font-mono", "text-xs")}>
									{type}
								</Badge>
								<div className={cn("flex", "gap-3")}>
									<span className={cn("text-muted-foreground")}>
										{stats.count}x
									</span>
									<span
										className={`font-mono ${stats.avgScore >= 80 ? "text-success" : "text-warning"}`}
									>
										{stats.avgScore}
									</span>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div
				className={cn(
					"overflow-hidden",
					"rounded-card-lg",
					"border",
					"border-border/80",
					"bg-card",
					"shadow-level-2",
					"transition-colors",
				)}
			>
				<header>
					<h2 className={cn("font-heading", "text-lg", "font-medium")}>
						Recent Events
					</h2>
				</header>
				<div className={cn("px-4", "group-data-[size=sm]/card:px-3")}>
					{events.length === 0 ? (
						<p className={cn("text-sm", "text-muted-foreground")}>
							No events recorded yet
						</p>
					) : (
						<div
							className={cn(
								"flex",
								"flex-col",
								"max-h-60",
								"overflow-y-auto",
								"gap-1",
							)}
						>
							{events.map((e) => (
								<div
									key={`${e.event}-${e.timestamp}`}
									className={cn(
										"flex",
										"items-center",
										"gap-2",
										"text-xs",
										"font-mono",
									)}
								>
									<Badge
										variant={e.success ? "secondary" : "destructive"}
										className={cn("px-1", "py-0", "text-[10px]")}
									>
										{e.event}
									</Badge>
									<span className={cn("text-muted-foreground")}>
										{e.subject || "-"}
									</span>
									<span className={cn("text-muted-foreground")}>
										{e.questionType || "-"}
									</span>
									<span className={cn("ml-auto", "text-muted-foreground")}>
										<Timestamp time={e.timestamp} />
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div
				className={cn(
					"overflow-hidden",
					"rounded-card-lg",
					"border",
					"border-border/80",
					"bg-card",
					"shadow-level-2",
					"transition-colors",
				)}
			>
				<header>
					<h2 className={cn("font-heading", "text-lg", "font-medium")}>
						Recent Quality Records
					</h2>
				</header>
				<div className={cn("px-4", "group-data-[size=sm]/card:px-3")}>
					{recentQuality.length === 0 ? (
						<p className={cn("text-sm", "text-muted-foreground")}>
							No quality data yet
						</p>
					) : (
						<div
							className={cn(
								"flex",
								"flex-col",
								"max-h-60",
								"overflow-y-auto",
								"gap-1",
							)}
						>
							{recentQuality.map((r) => (
								<div
									key={`${r.questionType}-${r.timestamp}`}
									className={cn(
										"flex",
										"items-center",
										"gap-2",
										"text-xs",
										"font-mono",
									)}
								>
									<Badge
										variant={r.isValid ? "secondary" : "destructive"}
										className={cn("px-1", "py-0", "text-[10px]")}
									>
										{r.validationScore}
									</Badge>
									<span className={cn("text-muted-foreground")}>
										{r.questionType}
									</span>
									<span className={cn("text-muted-foreground")}>
										{r.subject}
									</span>
									<span className={cn("ml-auto", "text-muted-foreground")}>
										<Timestamp time={r.timestamp} />
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			<div
				className={cn(
					"overflow-hidden",
					"rounded-card-lg",
					"border",
					"border-border/80",
					"bg-card",
					"shadow-level-2",
					"p-6",
					"transition-colors",
				)}
			>
				<h2 className={cn("font-heading", "font-medium", "text-lg", "mb-4")}>
					Question Ratings
				</h2>
				<QuestionRatingsDashboard />
			</div>
		</div>
	);
}
