"use client";

import {
	AlertCircle,
	BookOpen,
	Brain,
	Clock,
	Flame,
	Target,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import { AccuracyBar } from "@/components/shared/accuracy-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
	type OverallAnalytics,
	type SubjectAnalytics,
	useAnalytics,
} from "@/hooks/use-analytics";

export function AnalyticsPanel() {
	const { analytics, isLoading, refresh } = useAnalytics();

	if (isLoading) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
			</div>
		);
	}

	if (!analytics || analytics.totalQuestions === 0) {
		return (
			<div className="text-center p-8">
				<Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
				<h3 className="text-lg font-semibold mb-2">No Analytics Yet</h3>
				<p className="text-muted-foreground mb-4">
					Complete some quizzes to see your performance analytics.
				</p>
				<a
					href="/quiz"
					className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-[--system-accent] text-background hover:bg-[--system-accent]/90 h-10 px-4 py-2"
				>
					Start Quiz
				</a>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<h2 className="text-2xl font-bold">Analytics</h2>
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
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
			<StatCard
				icon={Target}
				label="Overall Accuracy"
				value={`${Math.round(analytics.overallAccuracy * 100)}%`}
				trend={analytics.overallAccuracy >= 0.7 ? "up" : "down"}
			/>
			<StatCard
				icon={Brain}
				label="Questions Answered"
				value={analytics.totalQuestions.toString()}
			/>
			<StatCard
				icon={Clock}
				label="Study Time"
				value={formatStudyTime(analytics.totalStudyTime)}
			/>
			<StatCard
				icon={Flame}
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
	icon: typeof Target;
	label: string;
	value: string;
	trend?: "up" | "down" | "neutral";
}) {
	const trendColor =
		trend === "up"
			? "text-green-500"
			: trend === "down"
				? "text-red-500"
				: "text-muted-foreground";

	return (
		<Card>
			<CardContent className="p-4">
				<div className="flex items-center gap-2 text-muted-foreground mb-2">
					<Icon className="h-4 w-4" />
					<span className="text-xs">{label}</span>
				</div>
				<div
					className={`text-2xl font-bold flex items-center gap-2 ${trendColor}`}
				>
					{value}
					{trend === "up" && <TrendingUp className="h-4 w-4" />}
					{trend === "down" && <TrendingDown className="h-4 w-4" />}
				</div>
			</CardContent>
		</Card>
	);
}

function InsightsCard({ insights }: { insights: string[] }) {
	return (
		<Card className="bg-[--system-accent]/5 border-[--system-accent]/20">
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<Brain className="h-4 w-4 text-foreground" />
					Insights
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ul className="space-y-2">
					{insights.map((insight, i) => (
						<li key={i} className="text-sm flex items-start gap-2">
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
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<AlertCircle className="h-4 w-4" />
					Recommendations
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{topRecommendations.map((rec, i) => (
						<div
							key={i}
							className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
						>
							<div
								className={`w-2 h-2 rounded-full mt-2 ${
									rec.type === "practice"
										? "bg-blue-500"
										: rec.type === "exam"
											? "bg-purple-500"
											: "bg-green-500"
								}`}
							/>
							<div>
								<p className="text-sm font-medium">{rec.message}</p>
								{rec.topic && (
									<p className="text-xs text-muted-foreground">
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
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base flex items-center gap-2">
					<BookOpen className="h-4 w-4" />
					Subject Breakdown
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{subjects.map((subject) => (
						<div key={subject.subjectId} className="space-y-2">
							<div className="flex items-center justify-between">
								<span className="font-medium">{subject.subjectName}</span>
								<span className="text-sm text-muted-foreground">
									{Math.round(subject.accuracy * 100)}%
								</span>
							</div>
							<AccuracyBar
								accuracy={Math.round(subject.accuracy * 100)}
								showLabel={false}
								variant="simple"
								size="md"
							/>
							<div className="flex gap-4 text-xs text-muted-foreground">
								<span>{subject.totalQuestions} questions</span>
								<span>{subject.currentStreak} day streak</span>
								{subject.weakTopics.length > 0 && (
									<span className="text-red-500">
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
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-base">Weekly Progress</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="flex items-end gap-2 h-32">
					{progress.map((day, i) => (
						<div key={i} className="flex-1 flex flex-col items-center gap-1">
							<div
								className="w-full bg-[--system-accent]/80 rounded-t"
								style={{ height: `${day.accuracy * 100}%`, minHeight: "4px" }}
							/>
							<span className="text-xs text-muted-foreground">
								{new Date(day.date).toLocaleDateString("en", {
									weekday: "short",
								})}
							</span>
							<span className="text-xs">{day.questions}</span>
						</div>
					))}
				</div>
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
