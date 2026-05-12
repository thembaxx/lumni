"use client";

import { ArrowLeft, Check, Flag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ExamPaper } from "@/types/exam-paper";
import type { ExamAnswer } from "@/types/exam-session";

interface ExamResultsProps {
	paper: ExamPaper;
	answers: Record<string, ExamAnswer>;
	flags: string[];
	timeTaken: number;
}

function formatTime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	if (h > 0) return `${h}h ${m}m`;
	return `${m}m`;
}

export function ExamResults({
	paper,
	answers,
	flags,
	timeTaken,
}: ExamResultsProps) {
	const router = useRouter();

	const totalParts = paper.sections.reduce(
		(sum, s) => sum + s.questions.reduce((qsum, q) => qsum + q.parts.length, 0),
		0,
	);
	const answeredCount = Object.keys(answers).length;
	const flaggedCount = flags.length;

	return (
		<div className="min-h-dvh bg-[--system-grouped-background]">
			<div className="max-w-3xl mx-auto p-[--space-6] space-y-[--space-6]">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="ios-title-1 text-[--system-text-primary]">Exam Submitted</h1>
						<p className="ios-footnote text-[--system-text-secondary]">
							{paper.metadata.subject} {paper.metadata.paperCode}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/dashboard/practice")}
					>
						<ArrowLeft className="size-4 mr-1" />
						Back to Exams
					</Button>
				</div>

				<div className="grid grid-cols-2 md:grid-cols-4 gap-[--space-3]">
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Answered
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="ios-title-3 font-bold">
								{answeredCount}
								<span className="ios-footnote font-normal text-[--system-text-secondary]">
									/{totalParts}
								</span>
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Unanswered
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-destructive">
								{totalParts - answeredCount}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Flagged
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
								{flaggedCount}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Time Taken
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="ios-title-3 font-bold tabular-nums">{formatTime(timeTaken)}</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="ios-headline">Score Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="max-h-[400px]">
							<div className="space-y-4">
								{paper.sections.map((section) => (
									<div key={section.id}>
										<h3 className="ios-subhead font-semibold text-[--system-text-secondary] uppercase">
											Section {section.id}
										</h3>
										{section.questions.map((question) => (
											<div key={question.id} className="ml-2 mb-3">
												<p className="text-sm font-medium mb-1">
													Q{question.id}
													{question.title ? `: ${question.title}` : ""}
												</p>
												<div className="flex flex-wrap gap-1.5">
													{question.parts.map((part) => {
														const fullId = `${section.id}-${question.id}-${part.id}`;
														const answered = !!answers[fullId];
														const flagged = flags.includes(fullId);

														return (
															<div
																key={part.id}
																className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
																	answered
																		? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200"
																		: "bg-muted text-muted-foreground"
																} ${flagged ? "ring-1 ring-amber-300" : ""}`}
															>
																{answered ? (
																	<Check className="w-3 h-3" />
																) : (
																	<X className="w-3 h-3" />
																)}
																{part.id}
																{flagged && (
																	<Flag className="w-2.5 h-2.5 text-amber-500 dark:text-amber-400" />
																)}
															</div>
														);
													})}
												</div>
											</div>
										))}
									</div>
								))}
							</div>
						</ScrollArea>
					</CardContent>
				</Card>

				{flaggedCount > 0 && (
					<Card>
						<CardHeader>
							<CardTitle className="ios-headline flex items-center gap-2">
								<Flag className="size-4 text-amber-500 dark:text-amber-400" />
								Flagged for Review
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="space-y-1">
								{paper.sections
									.flatMap((section) =>
										section.questions.flatMap((question) =>
											question.parts
												.map((part) => {
													const fullId = `${section.id}-${question.id}-${part.id}`;
													return flags.includes(fullId)
														? {
																id: fullId,
																label: `Section ${section.id}, Q${question.id}.${part.id}`,
															}
														: null;
												})
												.filter(
													(x): x is { id: string; label: string } => x !== null,
												),
										),
									)
									.map((item) => (
										<li
											key={item.id}
											className="text-sm text-muted-foreground flex items-center gap-2"
										>
											<Flag className="w-3 h-3 text-amber-400 dark:text-amber-300" />
											{item.label}
										</li>
									))}
							</ul>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
