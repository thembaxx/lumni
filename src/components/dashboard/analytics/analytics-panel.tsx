"use client";

import {
	AlertCircleIcon,
	BookOpen01Icon,
	BrainIcon,
	ChartDownIcon,
	ChartUpIcon,
	Clock01Icon,
	CrownIcon,
	FireIcon,
	Target01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { AccuracyBar } from "@/components/shared/accuracy-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/ui/charts/bar-chart";
import {
	type OverallAnalytics,
	type SubjectAnalytics,
	useAnalytics,
} from "@/hooks/use-analytics";
import { usePremium } from "@/lib/premium/premium-context";

export function AnalyticsPanel() {
	const { hasFeature } = usePremium();
	const { analytics, isLoading, refresh } = useAnalytics();

	if (!hasFeature("advanced-analytics")) {
		return (
			<Card className="flex flex-col items-center gap-4 p-8 text-center">
				<HugeiconsIcon icon={CrownIcon} className="size-10 text-amber-400" />
				<div>
					<p className="font-semibold text-lg">Premium Feature</p>
					<p className="mt-1 text-muted-foreground text-sm">
						Advanced analytics with detailed performance breakdowns are
						available on Premium.
					</p>
				</div>
				<Button asChild>
					<Link href="/premium">
						<HugeiconsIcon icon={CrownIcon} data-icon="inline-start" />
						Upgrade Now
					</Link>
				</Button>
			</Card>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="size-8 animate-spin rounded-full border-foreground border-b-2" />
			</div>
		);
	}

	if (!analytics || analytics.totalQuestions === 0) {
		return (
			<div className="p-8 text-center">
				<HugeiconsIcon
					icon={BrainIcon}
					className="mx-auto mb-4 size-12 text-muted-foreground"
				/>
				<h3 className="mb-2 font-semibold text-lg">No Analytics Yet</h3>
				<p className="mb-4 text-muted-foreground">
					Complete some quizzes to see your performance analytics.
				</p>
				<Button render={<Link href="/quiz">Start Quiz</Link>}>
					Start Quiz
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-between">
				<h2 className="font-semibold text-2xl">Analytics</h2>
				<Button variant="ghost" onClick={refresh}>
					Refresh
				</Button>
			</div>

			<OverallStatsCard analytics={analytics} />

			{analytics.insights.length > 0 && (
				<InsightsCard insights={analytics.insights} />
			)}

			<RecommendationsCard recommendations={analytics.recommendations} />

			<SubjectBreakdownCard subjects={analytics.subjects} />

			{analytics.weeklyProgress.length > 0 && (
				<WeeklyProgressCard progress={analytics.weeklyProgress} />
			)}
		</div>
	);
}

function OverallStatsCard({ analytics }: { analytics: OverallAnalytics }) {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
			<StatCard
				icon={Target01Icon}
				label="Overall Accuracy"
				value={`${Math.round(analytics.overallAccuracy * 100)}%`}
				trend={analytics.overallAccuracy >= 0.7 ? "up" : "down"}
			/>
			<StatCard
				icon={BrainIcon}
				label="Questions Answered"
				value={analytics.totalQuestions.toString()}
			/>
			<StatCard
				icon={Clock01Icon}
				label="Study Time"
				value={formatStudyTime(analytics.totalStudyTime)}
			/>
			<StatCard
				icon={FireIcon}
				label="Current Streak"
				value={`${analytics.currentStreak} days`}
				trend={analytics.currentStreak > 0 ? "up" : "neutral"}
			/>
		</div>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
	trend,
}: {
	icon: typeof Target01Icon;
	label: string;
	value: string;
	trend?: "up" | "down" | "neutral";
}) {
	const trendColor =
		trend === "up"
			? "text-success"
			: trend === "down"
				? "text-destructive"
				: "text-muted-foreground";

	return (
		<Card size="sm">
			<CardContent>
				<div className="mb-2 flex items-center gap-2 text-muted-foreground">
					<HugeiconsIcon icon={Icon} className="size-4" />
					<span className="text-xs">{label}</span>
				</div>
				<div
					className={`flex items-center gap-2 font-extrabold text-2xl ${trendColor}`}
				>
					{value}
					{trend === "up" && (
						<HugeiconsIcon icon={ChartUpIcon} className="size-4" />
					)}
					{trend === "down" && (
						<HugeiconsIcon icon={ChartDownIcon} className="size-4" />
					)}
				</div>
			</CardContent>
		</Card>
	);
}

function InsightsCard({ insights }: { insights: string[] }) {
	return (
		<Card
			size="sm"
			className="border-[--system-accent]/20 bg-[--system-accent]/5"
		>
			<CardHeader>
				<CardTitle>
					<HugeiconsIcon icon={BrainIcon} className="size-4 text-foreground" />
					Insights
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="flex flex-col gap-2">
					{insights.map((insight) => (
						<li key={insight} className="flex items-start gap-2 text-sm">
							<span className="text-foreground">•</span>
							{insight}
						</li>
					))}
				</ul>
			</CardContent>
		</Card>
	);
}

function RecommendationsCard({
	recommendations,
}: {
	recommendations: OverallAnalytics["recommendations"];
}) {
	const topRecommendations = recommendations.slice(0, 3);

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>
					<HugeiconsIcon icon={AlertCircleIcon} className="size-4" />
					Recommendations
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-3">
					{topRecommendations.map((rec) => (
						<div
							key={`rec-${rec.message}`}
							className="flex items-start gap-3 rounded-lg bg-muted/50 p-3"
						>
							<div
								className={`mt-2 size-2 rounded-full ${
									rec.type === "practice"
										? "bg-[--system-accent]"
										: rec.type === "exam"
											? "bg-chart-2"
											: "bg-success"
								}`}
							/>
							<div>
								<p className="font-medium text-sm">{rec.message}</p>
								{rec.topic && (
									<p className="text-muted-foreground text-xs">
										Topic: {rec.topic}
									</p>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function SubjectBreakdownCard({ subjects }: { subjects: SubjectAnalytics[] }) {
	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>
					<HugeiconsIcon icon={BookOpen01Icon} className="size-4" />
					Subject Breakdown
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex flex-col gap-4">
					{subjects.map((subject) => (
						<div key={subject.subjectId} className="flex flex-col gap-2">
							<div className="flex items-center justify-between">
								<span className="font-medium">{subject.subjectName}</span>
								<span className="text-muted-foreground text-sm">
									{Math.round(subject.accuracy * 100)}%
								</span>
							</div>
							<AccuracyBar
								accuracy={Math.round(subject.accuracy * 100)}
								showLabel={false}
								variant="simple"
								size="md"
							/>
							<div className="flex gap-4 text-muted-foreground text-xs">
								<span>{subject.totalQuestions} questions</span>
								<span>{subject.currentStreak} day streak</span>
								{subject.weakTopics.length > 0 && (
									<span className="text-destructive">
										Weak: {subject.weakTopics[0].topic}
									</span>
								)}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}

function WeeklyProgressCard({
	progress,
}: {
	progress: OverallAnalytics["weeklyProgress"];
}) {
	const chartData = progress.map((day) => ({
		day: new Date(day.date).toLocaleDateString("en", { weekday: "short" }),
		accuracy: Math.round(day.accuracy * 100),
	}));

	const chartConfig = {
		accuracy: {
			label: "Accuracy",
			color: "var(--system-accent)",
		},
	};

	return (
		<Card size="sm">
			<CardHeader>
				<CardTitle>Weekly Progress</CardTitle>
			</CardHeader>
			<CardContent>
				<BarChart
					data={chartData}
					xKey="day"
					yKey="accuracy"
					config={chartConfig}
				/>
			</CardContent>
		</Card>
	);
}

function formatStudyTime(minutes: number): string {
	if (minutes < 60) return `${Math.round(minutes)}m`;
	const hours = Math.floor(minutes / 60);
	const mins = Math.round(minutes % 60);
	if (hours < 24) return `${hours}h ${mins}m`;
	const days = Math.floor(hours / 24);
	return `${days}d ${hours % 24}h`;
}
