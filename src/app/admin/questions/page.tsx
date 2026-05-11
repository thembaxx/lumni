"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MarkdownRenderer } from "@/components/markdown-renderer";
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
			const res = await fetch(`/api/engine/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, count: 5, questionType: "any" }),
			});
			const data = await res.json();
			if (data.questions) {
				setQuestions(data.questions.map((q: Question) => ({
					question: q,
					generatedAt: new Date().toISOString(),
				})));
			}
		} catch (err) {
			console.error("Failed to fetch questions:", err);
		}
		setIsLoading(false);
	}, [subject]);

	const generateSingleType = useCallback(async (type: string) => {
		setIsGenerating(true);
		try {
			const res = await fetch(`/api/engine/generate`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, count: 3, questionType: type }),
			});
			const data = await res.json();
			if (data.questions) {
				const newQuestions = data.questions.map((q: Question) => ({
					question: q,
					generatedAt: new Date().toISOString(),
				}));
				setQuestions((prev) => [...newQuestions, ...prev].slice(0, 20));
			}
		} catch (err) {
			console.error(`Failed to generate ${type}:`, err);
		}
		setIsGenerating(false);
	}, [subject]);

	const questionTypes = [
		"multiple-choice", "matching", "short-answer", "long-answer",
		"essay", "calculation", "diagram", "programming",
		"source-based", "data-response", "mixed",
	];

	return (
		<div className="min-h-screen bg-background p-6 max-w-4xl mx-auto space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Question Engine Admin</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
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
				</CardContent>
			</Card>

			{isLoading && (
				<Card>
					<CardContent className="p-6 space-y-4">
						<Skeleton className="h-6 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
						<Skeleton className="h-24 w-full" />
					</CardContent>
				</Card>
			)}

			{questions.map((item, i) => {
				const q = item.question;
				const isExpanded = expandedId === `${i}`;
				return (
					<Card key={i}>
						<CardContent className="p-4">
							<div className="flex items-center gap-3 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : `${i}`)}>
								<Badge variant="outline" className="font-mono text-xs">{q.type}</Badge>
								<span className="text-sm font-medium truncate flex-1">{q.questionText.slice(0, 120)}...</span>
							</div>
							{isExpanded && (
								<div className="pt-4 space-y-4 border-t mt-3">
									<div className="text-sm">
										<MarkdownRenderer content={q.questionText} subject={subject} />
									</div>
									<div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
										<div><span className="font-medium">Difficulty:</span> {q.difficulty}</div>
										<div><span className="font-medium">Points:</span> {q.points}</div>
										<div><span className="font-medium">Bloom:</span> {q.bloomTaxonomy}</div>
										<div><span className="font-medium">Topic:</span> {q.topic}</div>
									</div>
									<div className="rounded-lg bg-muted/30 p-3 text-sm">
										<p className="font-medium text-xs text-muted-foreground mb-1">Hint:</p>
										{q.hint}
									</div>
									<div className="rounded-lg bg-success/10 p-3 text-sm">
										<p className="font-medium text-xs text-muted-foreground mb-1">Explanation:</p>
										<MarkdownRenderer content={q.explanation} subject={subject} />
									</div>
									{q.steps && q.steps.length > 0 && (
										<div className="rounded-lg bg-muted/20 p-3 text-sm">
											<p className="font-medium text-xs text-muted-foreground mb-1">Steps:</p>
											<ol className="list-decimal list-inside space-y-1">
												{q.steps.map((s, si) => <li key={si}>{s}</li>)}
											</ol>
										</div>
									)}
								</div>
							)}
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
