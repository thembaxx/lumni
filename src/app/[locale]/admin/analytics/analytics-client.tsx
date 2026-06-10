"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/headers/page-header";

interface AnalyticsData {
	totalUsers: number;
	activeUsers: number;
	totalQuestions: number;
	totalStudySessions: number;
	totalExamSessions: number;
	monthlySessions: number;
	completionRate: number;
	overallAccuracy: number;
	subjectPopularity: { subject: string; code: string; sessions: number }[];
}

export function AnalyticsClient() {
	const { data, isLoading, isError, error } = useQuery({
		queryKey: ["admin-analytics"],
		queryFn: async () => {
			const res = await fetch("/api/admin/analytics");
			if (!res.ok) throw new Error("Failed to fetch analytics");
			return res.json() as Promise<AnalyticsData>;
		},
	});

	const stats = [
		{ label: "Active Users (7d)", value: data?.activeUsers ?? "—" },
		{ label: "Questions Generated", value: data?.totalQuestions ?? "—" },
		{ label: "Study Sessions (30d)", value: data?.monthlySessions ?? "—" },
		{ label: "Exam Sessions", value: data?.totalExamSessions ?? "—" },
		{ label: "Completion Rate", value: data ? `${data.completionRate}%` : "—" },
		{
			label: "Overall Accuracy",
			value: data ? `${data.overallAccuracy}%` : "—",
		},
	];

	return (
		<div className="min-h-dvh bg-background">
			<PageHeader title="Analytics" subtitle="Platform usage statistics" />
			<div className="flex flex-col gap-4 p-4">
				{isError && (
					<div className="rounded-card-lg border border-destructive/60 bg-destructive/5 p-4 text-destructive text-sm">
						Failed to load analytics: {error?.message}
					</div>
				)}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
					{stats.map((stat) => (
						<Card key={stat.label} size="sm">
							<CardHeader>
								<CardTitle className="font-normal text-muted-foreground text-xs">
									{stat.label}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="font-bold text-2xl tabular-nums">
									{isLoading ? "…" : stat.value}
								</p>
							</CardContent>
						</Card>
					))}
				</div>

				<Card>
					<CardHeader>
						<CardTitle>Subject Popularity</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoading && (
							<p className="text-muted-foreground text-xs">Loading…</p>
						)}
						{!isLoading &&
							(!data?.subjectPopularity ||
								data.subjectPopularity.length === 0) && (
								<p className="text-muted-foreground text-xs">No data yet</p>
							)}
						{data?.subjectPopularity && data.subjectPopularity.length > 0 && (
							<div className="flex flex-col gap-2">
								{data.subjectPopularity.map((s) => (
									<div
										key={s.code}
										className="flex items-center justify-between text-xs"
									>
										<span className="font-medium">{s.subject}</span>
										<span className="text-muted-foreground tabular-nums">
											{s.sessions} sessions
										</span>
									</div>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
