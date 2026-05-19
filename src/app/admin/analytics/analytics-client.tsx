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
	const { data, isLoading } = useQuery({
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
		<div className="min-h-[100dvh] bg-background">
			<PageHeader title="Analytics" subtitle="Platform usage statistics" />
			<div className="p-4 flex flex-col gap-4">
				<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
					{stats.map((stat) => (
						<Card key={stat.label} size="sm">
							<CardHeader>
								<CardTitle className="text-xs text-muted-foreground font-normal">
									{stat.label}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<p className="text-2xl font-bold tabular-nums">
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
							<p className="text-xs text-muted-foreground">Loading...</p>
						)}
						{!isLoading &&
							(!data?.subjectPopularity ||
								data.subjectPopularity.length === 0) && (
								<p className="text-xs text-muted-foreground">No data yet</p>
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
