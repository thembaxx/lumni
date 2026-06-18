"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StudentReport {
	competencies: {
		subjectId: string;
		topicId: string;
		level: string;
		score: number;
	}[];
	quizAttempts: {
		subject: string;
		score: number;
		total: number;
		date: number;
	}[];
	subjects: { name: string }[];
}

export function StudentReportClient({
	params,
}: {
	params: Promise<{ studentId: string }>;
}) {
	const { studentId } = use(params);

	const { data, isLoading, isError } = useQuery({
		queryKey: ["student-report", studentId],
		queryFn: async () => {
			const res = await fetch(`/api/teacher/students/${studentId}/report`);
			if (!res.ok) throw new Error("Failed to fetch");
			return res.json() as Promise<StudentReport>;
		},
		enabled: !!studentId,
	});

	if (isLoading)
		return (
			<div className="p-8">
				<Skeleton className="h-96 rounded-xl" />
			</div>
		);
	if (isError || !data) return null;

	return (
		<div className="mx-auto max-w-3xl space-y-6 p-8">
			<div className="flex items-center justify-between">
				<h1 className="font-bold font-heading text-xl">
					Student Progress Report
				</h1>
				<Button onClick={() => window.print()} size="sm">
					Print / PDF
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Subject Competencies</CardTitle>
				</CardHeader>
				<CardContent>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pb-2 font-medium">Subject</th>
								<th className="pb-2 font-medium">Topic</th>
								<th className="pb-2 font-medium">Level</th>
								<th className="pb-2 font-medium">Score</th>
							</tr>
						</thead>
						<tbody>
							{data.competencies.length === 0 && (
								<tr>
									<td
										colSpan={4}
										className="py-4 text-center text-muted-foreground"
									>
										No competency data available
									</td>
								</tr>
							)}
							{data.competencies.map((c) => (
								<tr
									key={c.subjectId + c.topicId}
									className="border-b last:border-0"
								>
									<td className="py-2">{c.subjectId}</td>
									<td className="py-2">{c.topicId}</td>
									<td className="py-2">{c.level}</td>
									<td className="py-2">{c.score}%</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Quiz History</CardTitle>
				</CardHeader>
				<CardContent>
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b text-left text-muted-foreground">
								<th className="pb-2 font-medium">Subject</th>
								<th className="pb-2 font-medium">Score</th>
								<th className="pb-2 font-medium">Date</th>
							</tr>
						</thead>
						<tbody>
							{data.quizAttempts.length === 0 && (
								<tr>
									<td
										colSpan={3}
										className="py-4 text-center text-muted-foreground"
									>
										No quiz data available
									</td>
								</tr>
							)}
							{data.quizAttempts.map((a) => (
								<tr key={a.subject + a.date} className="border-b last:border-0">
									<td className="py-2">{a.subject}</td>
									<td className="py-2">
										{a.score}/{a.total}
									</td>
									<td className="py-2">
										{new Date(a.date).toLocaleDateString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<style>{`
        @media print {
          button { display: none; }
          body { padding: 0; margin: 0; }
        }
      `}</style>
		</div>
	);
}
