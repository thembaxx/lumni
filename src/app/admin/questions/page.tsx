"use client";

import { useCallback, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Question } from "@/lib/question-engine/types";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";

interface QuestionWithMeta {
	question: Question;
	generatedAt: string;
}

export default function AdminQuestionsPage() {
	const [subject, setSubject] = useState("mathematics");
	const [questions, setQuestions] = useState<QuestionWithMeta[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const fetchQuestions = useCallback(async () => {
		setIsLoading(true);
		try {
			const data = await apiFetch<{ questions?: Question[] }>(
				`/api/engine/generate`,
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subject, count: 5, questionType: "any" }),
				},
			);
			if (data.questions) {
				setQuestions(
					data.questions.map((q: Question) => ({
						question: q,
						generatedAt: new Date().toISOString(),
					})),
				);
			}
		} catch (err) {
			showBudgetToast(err);
			console.error("Failed to fetch questions:", err);
		}
		setIsLoading(false);
	}, [subject]);

	const generateSingleType = useCallback(
		async (type: string) => {
			setIsGenerating(true);
			try {
				const data = await apiFetch<{ questions?: Question[] }>(
					`/api/engine/generate`,
					{
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ subject, count: 3, questionType: type }),
					},
				);
				if (data.questions) {
					const newQuestions = data.questions.map((q: Question) => ({
						question: q,
						generatedAt: new Date().toISOString(),
					}));
					setQuestions((prev) => [...newQuestions, ...prev].slice(0, 20));
				}
			} catch (err) {
				showBudgetToast(err);
				console.error(`Failed to generate ${type}:`, err);
			}
			setIsGenerating(false);
		},
		[subject],
	);

	const questionTypes = [
		"multiple-choice",
		"matching",
		"short-answer",
		"long-answer",
		"essay",
		"calculation",
		"diagram",
		"programming",
		"source-based",
		"data-response",
		"mixed",
	];

	return (
		<div className="mx-auto min-h-dvh max-w-4xl space-y-6 bg-background p-6">
			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<header>
					<h2 className="font-heading font-medium text-sm">
						Question Engine Admin
					</h2>
				</header>
				<div className="space-y-4 px-4 group-data-[size=sm]/card:px-3">
					<div className="flex gap-2">
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Subject (e.g. mathematics)"
							className="flex-1"
						/>
						<Button onClick={fetchQuestions} disabled={isLoading}>
							{isLoading ? "Loading..." : "Generate Mixed"}
						</Button>
					</div>
					<div className="flex flex-wrap gap-2">
						{questionTypes.map((type) => (
							<Button
								key={type}
								variant="outline"
								size="sm"
								onClick={() => generateSingleType(type)}
								disabled={isGenerating}
							>
								{type}
							</Button>
						))}
					</div>
				</div>
			</div>

			{isLoading && (
				<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
					<div className="space-y-4 p-6 px-4 group-data-[size=sm]/card:px-3">
						<Skeleton className="h-6 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-24 w-full" />
					</div>
				</div>
			)}

			{questions.map((item) => {
				const q = item.question;
				const itemKey = `${q.type}-${q.topic}-${item.generatedAt}`;
				const isExpanded = expandedId === itemKey;
				return (
					<div
						key={itemKey}
						className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors"
					>
						<div className="p-4 px-4 group-data-[size=sm]/card:px-3">
							<button
								type="button"
								tabIndex={0}
								className="flex cursor-pointer items-center gap-3"
								onClick={() => setExpandedId(isExpanded ? null : itemKey)}
								aria-expanded={isExpanded}
							>
								<Badge variant="outline" className="font-mono text-xs">
									{q.type}
								</Badge>
								<span className="flex-1 truncate font-medium text-sm">
									{q.questionText.slice(0, 120)}...
								</span>
							</button>
							{isExpanded && (
								<div className="mt-3 space-y-4 border-t pt-4">
									<div className="text-sm">
										<MarkdownRenderer
											content={q.questionText}
											subject={subject}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4 text-muted-foreground text-xs">
										<div>
											<span className="font-medium">Difficulty:</span>{" "}
											{q.difficulty}
										</div>
										<div>
											<span className="font-medium">Points:</span> {q.points}
										</div>
										<div>
											<span className="font-medium">Bloom:</span>{" "}
											{q.bloomTaxonomy}
										</div>
										<div>
											<span className="font-medium">Topic:</span> {q.topic}
										</div>
									</div>
									<div className="rounded-lg bg-muted/30 p-3 text-sm">
										<p className="mb-1 font-medium text-muted-foreground text-xs">
											Hint:
										</p>
										{q.hint}
									</div>
									<div className="rounded-lg bg-success/10 p-3 text-sm">
										<p className="mb-1 font-medium text-muted-foreground text-xs">
											Explanation:
										</p>
										<MarkdownRenderer
											content={q.explanation}
											subject={subject}
										/>
									</div>
									{q.steps && q.steps.length > 0 && (
										<div className="rounded-lg bg-muted/20 p-3 text-sm">
											<p className="mb-1 font-medium text-muted-foreground text-xs">
												Steps:
											</p>
											<ol className="list-inside list-decimal space-y-1">
												{q.steps.map((s) => (
													<li key={s}>{s}</li>
												))}
											</ol>
										</div>
									)}
								</div>
							)}
						</div>
					</div>
				);
			})}
		</div>
	);
}
