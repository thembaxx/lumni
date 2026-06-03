"use client";
import { use, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface GhostStats {
	totalStudents: number;
	subjectEnrollments: Record<string, number>;
	avgScores: Record<string, number>;
	totalQuizAttempts: number;
	completionRate: number;
}

export default function GhostDashboardPage({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = use(params);
	const [stats, setStats] = useState<GhostStats | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		fetch(`/api/ghost/${token}`)
			.then((r) => (r.ok ? r.json() : Promise.reject()))
			.then((d) => {
				setStats(d);
				setLoading(false);
			})
			.catch(() => {
				setError(true);
				setLoading(false);
			});
	}, [token]);

	if (loading)
		return (
			<div className="p-8">
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	if (error)
		return (
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Invalid or expired link</p>
			</div>
		);
	if (!stats) return null;

	return (
		<div className="mx-auto max-w-2xl space-y-6 p-8">
			<h1 className="font-bold font-heading text-xl">School Dashboard</h1>
			<div className="grid grid-cols-2 gap-4">
				<Card>
					<CardHeader>
						<CardTitle>Students</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-bold text-3xl">{stats.totalStudents}</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>Quiz Completion</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="font-bold text-3xl">{stats.completionRate}%</p>
					</CardContent>
				</Card>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>Subject Enrollment</CardTitle>
				</CardHeader>
				<CardContent>
					{Object.entries(stats.subjectEnrollments).map(([sub, count]) => (
						<div key={sub} className="flex items-center justify-between py-1">
							<span className="text-sm">{sub}</span>
							<span className="font-medium text-sm">{count} students</span>
						</div>
					))}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Average Scores</CardTitle>
				</CardHeader>
				<CardContent>
					{Object.entries(stats.avgScores).map(([sub, score]) => (
						<div key={sub} className="flex items-center justify-between py-1">
							<span className="text-sm">{sub}</span>
							<span className="font-medium text-sm">{score}%</span>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
