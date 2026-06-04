"use client";

import { use, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { dexieDataAccess } from "@/lib/db";

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

export default function StudentReportPage({
	params,
}: {
	params: Promise<{ studentId: string }>;
}) {
	use(params);
	const [data, setData] = useState<StudentReport | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		Promise.all([
			dexieDataAccess.competencies.toArray(),
			dexieDataAccess.quizAttempts.toArray(),
			dexieDataAccess.subjects.toArray(),
		]).then(([competencies, quizAttempts, subjects]) => {
			setData({
				competencies: competencies.map((c) => ({
					subjectId: c.subjectId,
					topicId: c.topicId,
					level: c.level,
					score: c.score,
				})),
				quizAttempts: quizAttempts.map((a) => ({
					subject: a.odSubject,
					score: a.score,
					total: a.totalQuestions,
					date: a.completedAt,
				})),
				subjects: subjects.map((s) => ({ name: s.name })),
			});
			setLoading(false);
		});
	}, []);

	if (loading)
		return (
			<div className="p-8">
				<Skeleton className="h-96 rounded-xl" />
			</div>
		);
	if (!data) return null;

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
							{data.quizAttempts
								.toReversed()
								.slice(0, 20)
								.map((a) => (
									<tr
										key={a.subject + a.date}
										className="border-b last:border-0"
									>
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

			<style jsx global>{`
        @media print {
          button { display: none; }
          body { padding: 0; margin: 0; }
        }
      `}</style>
		</div>
	);
}
