"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { cn } from "@/lib/shared";

async function fetchQuestions(
	subject?: string,
	type?: string,
): Promise<PastPaperQuestion[]> {
	try {
		const params = new URLSearchParams({ limit: "50" });
		if (subject) params.set("subject", subject);
		if (type) params.set("type", type);
		const res = await fetch(`/api/exam-papers/questions?${params.toString()}`);
		if (!res.ok) return [];
		const data = await res.json();
		return data.questions || [];
	} catch {
		return [];
	}
}

export default function AdminPastPapersPage() {
	const [subjectFilter, setSubjectFilter] = useState("");
	const [typeFilter, setTypeFilter] = useState("");
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const { data: questions = [], isLoading } = useQuery({
		queryKey: ["admin", "past-paper-questions", subjectFilter, typeFilter],
		queryFn: () =>
			fetchQuestions(subjectFilter || undefined, typeFilter || undefined),
		refetchInterval: 15000,
	});

	const subjects = [...new Set(questions.map((q) => q.subject))].sort();
	const types = [...new Set(questions.map((q) => q.questionType))].sort();

	return (
		<div
			className={cn(
				"mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 bg-background p-6",
			)}
		>
			<h1 className={cn("font-extrabold text-2xl")}>Past Paper Questions</h1>

			<div className={cn("flex flex-wrap items-center gap-2")}>
				<select
					value={subjectFilter}
					onChange={(e) => setSubjectFilter(e.target.value)}
					className={cn(
						"rounded-lg border border-border bg-card px-3 py-1.5 text-sm",
					)}
				>
					<option value="">All subjects</option>
					{subjects.map((s) => (
						<option key={s} value={s}>
							{s}
						</option>
					))}
				</select>
				<select
					value={typeFilter}
					onChange={(e) => setTypeFilter(e.target.value)}
					className={cn(
						"rounded-lg border border-border bg-card px-3 py-1.5 text-sm",
					)}
				>
					<option value="">All types</option>
					{types.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
				<span className={cn("ml-auto text-muted-foreground text-sm")}>
					{questions.length} questions
				</span>
			</div>

			{isLoading ? (
				<div className={cn("flex items-center justify-center py-12")}>
					<div className="size-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
				</div>
			) : questions.length === 0 ? (
				<div
					className={cn(
						"rounded-card-lg border border-border/80 bg-card p-12 text-center text-muted-foreground",
					)}
				>
					<p>No questions extracted yet.</p>
					<p className={cn("mt-1 text-sm")}>
						Go to Admin &gt; Exam Papers and click the extract button.
					</p>
				</div>
			) : (
				<div className={cn("flex flex-col gap-3")}>
					{questions.map((q) => (
						<div
							key={q.id}
							className={cn(
								"overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors",
							)}
						>
							<button
								type="button"
								onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}
								className={cn(
									"flex w-full items-start gap-3 p-4 text-left hover:bg-muted/30",
								)}
							>
								<div className={cn("min-w-0 flex-1")}>
									<div className={cn("mb-1 flex items-center gap-2")}>
										<Badge variant="secondary" className={cn("text-[10px]")}>
											{q.subject}
										</Badge>
										<Badge variant="outline" className={cn("text-[10px]")}>
											{q.questionType}
										</Badge>
										<span className={cn("text-muted-foreground text-xs")}>
											{q.year} P{q.paperNumber}
										</span>
										<span
											className={cn("ml-auto text-muted-foreground text-xs")}
										>
											{q.marks} marks
										</span>
									</div>
									<p className={cn("line-clamp-2 text-sm")}>{q.questionText}</p>
								</div>
							</button>
							{expandedId === q.id && (
								<div
									className={cn(
										"flex flex-col gap-3 border-border/60 border-t p-4",
									)}
								>
									<div>
										<h4
											className={cn(
												"mb-1 font-medium text-muted-foreground text-xs",
											)}
										>
											Question
										</h4>
										<p className={cn("whitespace-pre-wrap text-sm")}>
											{q.questionText}
										</p>
									</div>
									{q.answerText && (
										<div>
											<h4
												className={cn(
													"mb-1 font-medium text-muted-foreground text-xs",
												)}
											>
												Answer
											</h4>
											<p
												className={cn(
													"whitespace-pre-wrap text-sm text-success",
												)}
											>
												{q.answerText}
											</p>
										</div>
									)}
									{q.sectionTitle && (
										<span className={cn("text-muted-foreground text-xs")}>
											Section: {q.sectionTitle}
										</span>
									)}
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	);
}
