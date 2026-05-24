"use client";

import {
	ArrowLeft01Icon,
	Cancel01Icon,
	CheckmarkCircle01Icon,
	Flag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
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
	const { push } = useRouter();

	const totalParts = paper.sections.reduce(
		(sum, s) => sum + s.questions.reduce((qsum, q) => qsum + q.parts.length, 0),
		0,
	);
	const answeredCount = Object.keys(answers).length;
	const flaggedCount = flags.length;

	return (
		<div className="min-h-dvh bg-[--system-grouped-background]">
			<PageContainer className="flex flex-col gap-[--space-6] py-[--space-6]">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<m.div
							initial={{ scale: 0.95, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ delay: 0.3 }}
						>
							<HugeiconsIcon
								icon={CheckmarkCircle01Icon}
								className="size-10 text-success"
							/>
						</m.div>
						<div>
							<h1 className="ios-title-1 text-[--system-text-primary]">
								Exam Submitted
							</h1>
							<p className="ios-footnote text-[--system-text-secondary]">
								{paper.metadata.subject} {paper.metadata.paperCode}
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => push("/dashboard/practice")}
					>
						<HugeiconsIcon icon={ArrowLeft01Icon} data-icon />
						Back to Exams
					</Button>
				</div>

				<div className="grid grid-cols-2 gap-[--space-3] md:grid-cols-4">
					<Card>
						<CardHeader>
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Answered
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="ios-title-3 font-extrabold">
								{answeredCount}
								<span className="ios-footnote font-normal text-[--system-text-secondary]">
									/{totalParts}
								</span>
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Unanswered
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-extrabold text-2xl text-destructive">
								{totalParts - answeredCount}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Flagged
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="font-extrabold text-2xl text-warning">
								{flaggedCount}
							</p>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="ios-caption-1 font-semibold text-[--system-text-secondary]">
								Time Taken
							</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="ios-title-3 font-extrabold tabular-nums">
								{formatTime(timeTaken)}
							</p>
						</CardContent>
					</Card>
				</div>

				<Card>
					<CardHeader>
						<CardTitle className="ios-headline">Score Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<ScrollArea className="max-h-[400px]">
							<div className="flex flex-col gap-4">
								{paper.sections.map((section) => (
									<div key={section.id}>
										<h3 className="ios-subhead font-semibold text-[--system-text-secondary] uppercase">
											Section {section.id}
										</h3>
										{section.questions.map((question) => (
											<div key={question.id} className="mb-3 ml-2">
												<p className="mb-1 font-medium text-sm">
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
																className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${
																	answered
																		? "bg-success/10 text-success-foreground"
																		: "bg-muted text-muted-foreground"
																} ${flagged ? "ring-1 ring-warning/30" : ""}`}
															>
																{answered ? (
																	<HugeiconsIcon
																		icon={CheckmarkCircle01Icon}
																		className="size-3"
																	/>
																) : (
																	<HugeiconsIcon
																		icon={Cancel01Icon}
																		className="size-3"
																	/>
																)}
																{part.id}
																{flagged && (
																	<HugeiconsIcon
																		icon={Flag01Icon}
																		className="size-2.5 text-warning"
																	/>
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
								<HugeiconsIcon
									icon={Flag01Icon}
									className="size-4 text-warning"
								/>
								Flagged for Review
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="flex flex-col gap-1">
								{paper.sections.flatMap((section) =>
									section.questions.flatMap((question) =>
										question.parts.flatMap((part) => {
											const fullId = `${section.id}-${question.id}-${part.id}`;
											return flags.includes(fullId)
												? [
														<li
															key={fullId}
															className="flex items-center gap-2 text-muted-foreground text-sm"
														>
															<HugeiconsIcon
																icon={Flag01Icon}
																className="size-3 text-warning-foreground"
															/>
															{`Section ${section.id}, Q${question.id}.${part.id}`}
														</li>,
													]
												: [];
										}),
									),
								)}
							</ul>
						</CardContent>
					</Card>
				)}
			</PageContainer>
		</div>
	);
}
