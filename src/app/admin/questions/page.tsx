"use client";

import { useCallback, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";
import type { Question } from "@/types/questions";

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
		<div className="min-h-[100dvh] bg-background p-6 max-w-4xl mx-auto space-y-6">
			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<header>
					<h2 className="font-heading text-sm font-medium">
						Question Engine Admin
					</h2>
				</header>
				<div className="px-4 group-data-[size=sm]/card:px-3 space-y-4">
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
					<div className="px-4 group-data-[size=sm]/card:px-3 p-6 space-y-4">
						<Skeleton className="h-6 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-24 w-full" />
					</div>
				</div>
			)}

			{questions.map((item, i) => {
				const q = item.question;
				const isExpanded = expandedId === `${i}`;
				return (
					<div
						key={i}
						className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors"
					>
						<div className="px-4 group-data-[size=sm]/card:px-3 p-4">
							<div
								className="flex items-center gap-3 cursor-pointer"
								onClick={() => setExpandedId(isExpanded ? null : `${i}`)}
							>
								<Badge variant="outline" className="font-mono text-xs">
									{q.type}
								</Badge>
								<span className="text-sm font-medium truncate flex-1">
									{q.questionText.slice(0, 120)}...
								</span>
							</div>
							{isExpanded && (
								<div className="pt-4 space-y-4 border-t mt-3">
									<div className="text-sm">
										<MarkdownRenderer
											content={q.questionText}
											subject={subject}
										/>
									</div>
									<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
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
										<p className="font-medium text-xs text-muted-foreground mb-1">
											Hint:
										</p>
										{q.hint}
									</div>
									<div className="rounded-lg bg-success/10 p-3 text-sm">
										<p className="font-medium text-xs text-muted-foreground mb-1">
											Explanation:
										</p>
										<MarkdownRenderer
											content={q.explanation}
											subject={subject}
										/>
									</div>
									{q.steps && q.steps.length > 0 && (
										<div className="rounded-lg bg-muted/20 p-3 text-sm">
											<p className="font-medium text-xs text-muted-foreground mb-1">
												Steps:
											</p>
											<ol className="list-decimal list-inside space-y-1">
												{q.steps.map((s, si) => (
													<li key={si}>{s}</li>
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
