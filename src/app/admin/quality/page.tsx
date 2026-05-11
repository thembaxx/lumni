"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

export default function AdminQualityPage() {
	const [quality, setQuality] = useState(getQualityStats());
	const [analytics, setAnalytics] = useState(getAnalyticsSummary());
	const [events, setEvents] = useState(loadEvents().slice(-20).reverse());
	const [recentQuality, setRecentQuality] = useState(
		loadQualityRecords().slice(-10).reverse(),
	);

	const refresh = useCallback(() => {
		setQuality(getQualityStats());
		setAnalytics(getAnalyticsSummary());
		setEvents(loadEvents().slice(-20).reverse());
		setRecentQuality(loadQualityRecords().slice(-10).reverse());
	}, []);

	useEffect(() => {
		const interval = setInterval(refresh, 5000);
		return () => clearInterval(interval);
	}, [refresh]);

	const handleClear = useCallback(() => {
		clearAnalytics();
		clearQualityRecords();
		refresh();
	}, [refresh]);

	return (
		<div className="min-h-screen bg-background p-6 max-w-5xl mx-auto space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Engine Quality & Analytics</h1>
				<Button variant="outline" size="sm" onClick={handleClear}>
					Clear Data
				</Button>
			</div>

			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Total Requests
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p className="text-3xl font-bold">{analytics.totalRequests}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Success Rate
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p
							className={`text-3xl font-bold ${analytics.successRate >= 80 ? "text-success" : analytics.successRate >= 50 ? "text-warning" : "text-destructive"}`}
						>
							{analytics.successRate}%
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Avg Validation Score
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p
							className={`text-3xl font-bold ${quality.avgScore >= 80 ? "text-success" : quality.avgScore >= 50 ? "text-warning" : "text-destructive"}`}
						>
							{quality.avgScore}
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-sm text-muted-foreground">
							Question Pass Rate
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<p
							className={`text-3xl font-bold ${quality.passRate >= 80 ? "text-success" : quality.passRate >= 50 ? "text-warning" : "text-destructive"}`}
						>
							{quality.passRate}%
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Requests Breakdown</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex justify-between text-sm">
							<span>Generate</span>
							<span className="font-mono">{analytics.generateCount}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Grade</span>
							<span className="font-mono">{analytics.gradeCount}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Hint</span>
							<span className="font-mono">{analytics.hintCount}</span>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Quality by Type</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{Object.entries(quality.byType).length === 0 && (
							<p className="text-sm text-muted-foreground">
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
								className="flex items-center justify-between text-sm"
							>
								<Badge variant="outline" className="font-mono text-xs">
									{type}
								</Badge>
								<div className="flex gap-3">
									<span className="text-muted-foreground">{stats.count}x</span>
									<span
										className={`font-mono ${stats.avgScore >= 80 ? "text-success" : "text-warning"}`}
									>
										{stats.avgScore}
									</span>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Recent Events</CardTitle>
				</CardHeader>
				<CardContent>
					{events.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No events recorded yet
						</p>
					) : (
						<div className="space-y-1 max-h-60 overflow-y-auto">
							{events.map((e, i) => (
								<div
									key={i}
									className="flex items-center gap-2 text-xs font-mono"
								>
									<Badge
										variant={e.success ? "secondary" : "destructive"}
										className="text-[10px] px-1 py-0"
									>
										{e.event}
									</Badge>
									<span className="text-muted-foreground">
										{e.subject || "-"}
									</span>
									<span className="text-muted-foreground">
										{e.questionType || "-"}
									</span>
									<span className="text-muted-foreground ml-auto">
										{new Date(e.timestamp).toLocaleTimeString()}
									</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Recent Quality Records</CardTitle>
				</CardHeader>
				<CardContent>
					{recentQuality.length === 0 ? (
						<p className="text-sm text-muted-foreground">No quality data yet</p>
					) : (
						<div className="space-y-1 max-h-60 overflow-y-auto">
							{recentQuality.map((r, i) => (
								<div
									key={i}
									className="flex items-center gap-2 text-xs font-mono"
								>
									<Badge
										variant={r.isValid ? "secondary" : "destructive"}
										className="text-[10px] px-1 py-0"
									>
										{r.validationScore}
									</Badge>
									<span className="text-muted-foreground">
										{r.questionType}
									</span>
									<span className="text-muted-foreground">{r.subject}</span>
									<span className="text-muted-foreground ml-auto">
										{new Date(r.timestamp).toLocaleTimeString()}
									</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
