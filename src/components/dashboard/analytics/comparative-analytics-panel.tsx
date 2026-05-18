"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "@/components/ui/charts/line-chart";
import { RadarChart } from "@/components/ui/charts/radar-chart";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/lib/auth/auth-context";
import { analyticsService } from "@/lib/services/analytics-service";

interface ComparativeAnalyticsData {
	userPercentile: number;
	subjectRankings: Record<string, number>;
	globalAverage: number;
	userAverage: number;
}

interface SubjectTrendData {
	dates: string[];
	accuracies: number[];
	trend: "improving" | "declining" | "stable";
}

export function ComparativeAnalyticsPanel() {
	const { analytics, isLoading } = useAnalytics();
	const { user } = useAuth();
	const [comparativeData, setComparativeData] =
		useState<ComparativeAnalyticsData | null>(null);
	const [subjectTrends, setSubjectTrends] = useState<
		Record<string, SubjectTrendData>
	>({});
	const [showSubjectDetail, setShowSubjectDetail] = useState(false);
	const [_isLoadingComparative, setIsLoadingComparative] = useState(false);
	const [_isLoadingTrends, setIsLoadingTrends] = useState(false);

	const loadComparativeAnalytics = useCallback(async () => {
		if (!user?.$id) return;
		setIsLoadingComparative(true);
		try {
			const data = await analyticsService.getComparativeAnalytics(user.$id);
			setComparativeData(data);
		} catch (error) {
			console.error("Error loading comparative analytics:", error);
		} finally {
			setIsLoadingComparative(false);
		}
	}, [user]);

	const loadSubjectTrends = useCallback(async () => {
		if (!analytics || !comparativeData || !user?.$id) return;

		setIsLoadingTrends(true);
		try {
			const weakSubjects = Object.entries(comparativeData.subjectRankings)
				.sort(([, rankA], [, rankB]) => rankA - rankB)
				.slice(0, 3)
				.map(([subject]) => subject);

			const trends: Record<string, SubjectTrendData> = {};

			await Promise.all(
				weakSubjects.map(async (subject) => {
					const data = await analyticsService.getSubjectTrend(
						user.$id,
						subject,
					);
					trends[subject] = data;
				}),
			);

			setSubjectTrends(trends);
		} catch (error) {
			console.error("Error loading subject trends:", error);
		} finally {
			setIsLoadingTrends(false);
		}
	}, [analytics, comparativeData, user]);

	// Load comparative analytics when user analytics loads
	useEffect(() => {
		if (analytics && !isLoading) {
			loadComparativeAnalytics();
		}
	}, [analytics, isLoading, loadComparativeAnalytics]);

	// Load trends for weak subjects when comparative data loads
	useEffect(() => {
		if (comparativeData) {
			loadSubjectTrends();
		}
	}, [comparativeData, loadSubjectTrends]);

	if (isLoading || !analytics) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full size-8 border-b-2 border-foreground" />
			</div>
		);
	}

	if (!analytics || analytics.totalQuestions === 0) {
		return (
			<div className="text-center p-8">
				<div className="mb-6">
					<svg
						className="mx-auto h-10 w-10 text-muted-foreground"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12h6m-6 4h6m2 5a7 7 0 11-14 0 7 7 0 0114 0z"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-semibold mb-2">No Analytics Yet</h3>
				<p className="text-muted-foreground mb-4">
					Complete some quizzes to see your performance analytics.
				</p>
				<Button render={<a href="/quiz" />} nativeButton={false}>Start Quiz</Button>
			</div>
		);
	}

	return (
		<div className="space-y-8 pt-6">
			{/* User Percentile */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center gap-2">
							<svg
								className="h-4 w-4 text-[--system-accent]"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4M7.5 10a4.5 4.5 0 013-3 4.5 4.5 0 013 3 4.5 4.5 0 01-3 3 4.5 4.5 0 01-3-3z"
								/>
							</svg>
							<span>Your Performance Percentile</span>
						</span>
						{comparativeData && (
							<span className="text-2xl font-extrabold">
								{comparativeData.userPercentile}%
							</span>
						)}
					</CardTitle>
				</CardHeader>
				{comparativeData && (
					<CardContent className="pt-4">
						<p className="text-sm text-muted-foreground">
							You scored better than {comparativeData.userPercentile}% of users
						</p>
						<div className="flex items-center justify-between mt-2">
							<span className="text-xs text-muted-foreground">
								Global Average:
							</span>
							<span className="text-xs font-mono">
								{comparativeData.globalAverage}%
							</span>
						</div>
						<div className="flex items-center justify-between mt-1">
							<span className="text-xs text-muted-foreground">
								Your Average:
							</span>
							<span className="text-xs font-mono">
								{comparativeData.userAverage.toFixed(1)}%
							</span>
						</div>
					</CardContent>
				)}
			</Card>

			{/* Subject Rankings (Radar Chart) */}
			{comparativeData &&
				Object.keys(comparativeData.subjectRankings).length > 0 && (
					<Card size="sm">
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<svg
										className="h-4 w-4 text-[--system-accent]"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8c4 0 6 4 6 4s-2 4-6 4-6-4-6-4 0-4 6-4zm0 0v8l4-2-4-2zm0 0V8l-4 2 4 2z"
										/>
									</svg>
									<span>Subject Performance Comparison</span>
								</span>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowSubjectDetail((v) => !v)}
								>
									<svg
										className="h-4 w-4 text-muted-foreground"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 5h6M5 9h6m6 6h6m6-6h6"
										/>
									</svg>
								</Button>
							</CardTitle>
						</CardHeader>
						<CardContent>
							{showSubjectDetail && comparativeData && (
								<div className="mb-4 overflow-x-auto">
									<table className="w-full text-xs">
										<thead>
											<tr className="border-b text-muted-foreground">
												<th className="text-left py-1 pr-2">Subject</th>
												<th className="text-right py-1 px-2">Accuracy</th>
												<th className="text-right py-1 pl-2">Rank</th>
											</tr>
										</thead>
										<tbody>
											{Object.entries(comparativeData.subjectRankings)
												.sort(([, a], [, b]) => b - a)
												.map(([subject, rank]) => {
													const accuracy = comparativeData.userAverage;
													return (
														<tr
															key={subject}
															className="border-b last:border-0"
														>
															<td className="py-1 pr-2 font-medium">
																{subject}
															</td>
															<td className="text-right py-1 px-2">
																{Math.round(accuracy)}%
															</td>
															<td className="text-right py-1 pl-2">{rank}th</td>
														</tr>
													);
												})}
										</tbody>
									</table>
								</div>
							)}
							<RadarChart
								data={{
									labels: Object.keys(comparativeData.subjectRankings),
									datasets: [
										{
											label: "Your Performance",
											data: Object.values(comparativeData.subjectRankings).map(
												(rank) => Math.min(100, rank * 2),
											),
											backgroundColor: "rgba(59, 130, 246, 0.2)",
											borderColor: "var(--system-accent)",
										},
										{
											label: "Average User",
											data: Object.keys(comparativeData.subjectRankings).map(
												() => 50,
											),
											backgroundColor: "rgba(100, 116, 139, 0.1)",
											borderColor: "var(--system-muted)",
										},
									],
								}}
							/>
						</CardContent>
					</Card>
				)}

			{/* Subject Trends (Line Charts) */}
			{Object.keys(subjectTrends).length > 0 && (
				<>
					<Card size="sm">
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<span className="flex items-center gap-2">
									<svg
										className="h-4 w-4 text-[--system-accent]"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8v4l3 3"
										/>
									</svg>
									<span>Performance Trends</span>
								</span>
							</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-4 md:grid-cols-2">
							{Object.entries(subjectTrends).map(([subject, trendData]) => (
								<div key={subject}>
									<div className="flex items-center justify-between mb-2">
										<h3 className="text-lg font-semibold">{subject}</h3>
										<span
											className={`text-xs font-medium ${
												trendData.trend === "improving"
													? "text-success"
													: trendData.trend === "declining"
														? "text-destructive"
														: "text-muted-foreground"
											}`}
										>
											{trendData.trend === "improving"
												? "Improving"
												: trendData.trend === "declining"
													? "Declining"
													: "Stable"}
										</span>
									</div>
									<LineChart
										data={trendData.dates.map((date, i) => ({
											date,
											accuracy: trendData.accuracies[i],
										}))}
										xKey="date"
										yKey="accuracy"
										config={{
											accuracy: {
												label: "Accuracy %",
												color: "var(--system-accent)",
											},
										}}
										height={192}
									/>
								</div>
							))}
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
