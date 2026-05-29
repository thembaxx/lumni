"use client";

import { useCallback, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { GradingResult, Question } from "@/lib/question-engine/types";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";

// TODO(react-doctor): Refactor multiple useState calls into useReducer
export default function DevEnginePage() {
	const [subject, setSubject] = useState("mathematics");
	const [topic, setTopic] = useState("algebra");
	const [count, setCount] = useState(2);
	const [questionType, setQuestionType] = useState("any");
	const [questions, setQuestions] = useState<Question[]>([]);
	const [grading, setGrading] = useState<Record<string, GradingResult>>({});
	const [rawJson, setRawJson] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleGenerate = useCallback(async () => {
		setIsLoading(true);
		setError("");
		setRawJson("");
		setQuestions([]);
		setGrading({});
		try {
			const data = await apiFetch<{ questions?: Question[]; error?: string }>(
				"/api/engine/generate",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						subject,
						topic: topic || undefined,
						count,
						questionType: questionType === "any" ? "any" : questionType,
					}),
				},
			);
			setRawJson(JSON.stringify(data, null, 2));
			if (data.questions) {
				setQuestions(data.questions);
			}
		} catch (err) {
			showBudgetToast(err);
			setError(err instanceof Error ? err.message : "Network error");
		}
		setIsLoading(false);
	}, [subject, topic, count, questionType]);

	const handleGrade = useCallback(async (q: Question) => {
		try {
			const result = await apiFetch<GradingResult>("/api/engine/grade", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					question: q,
					answer: { type: "text", value: "test answer" },
				}),
			});
			setGrading((prev) => ({ ...prev, [q.id]: result }));
		} catch (err) {
			showBudgetToast(err);
		}
	}, []);

	const types = [
		"any",
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
		<div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col gap-4 bg-background p-4 pb-20">
			<h1 className="font-semibold text-xl">Engine Integration Test</h1>

			<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
				<div className="flex flex-col gap-3 p-4 px-4 group-data-[size=sm]/card:px-3">
					<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
						<Input
							value={subject}
							onChange={(e) => setSubject(e.target.value)}
							placeholder="Subject"
						/>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder="Topic (optional)"
						/>
						<Input
							type="number"
							value={count}
							onChange={(e) => setCount(Number(e.target.value))}
							min={1}
							max={20}
							placeholder="Count"
						/>
						<Select
							value={questionType}
							onValueChange={(v) => v && setQuestionType(v)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{types.map((t) => (
									<SelectItem key={t} value={t}>
										{t}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button
						onClick={handleGenerate}
						disabled={isLoading}
						className="w-full"
					>
						{isLoading ? "Generating..." : "Generate"}
					</Button>
				</div>
			</div>

			{error && (
				<div className="overflow-hidden rounded-card-lg border border-border/80 border-destructive bg-card shadow-level-2 transition-colors">
					<div className="p-4 px-4 text-destructive text-sm group-data-[size=sm]/card:px-3">
						{error}
					</div>
				</div>
			)}

			{isLoading && <Skeleton className="h-48 w-full" />}

			{questions.length > 0 && (
				<>
					<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
						<header className="rounded-t-[2.5rem] border-border/80 border-t p-4 pb-2">
							<h2 className="font-heading font-medium text-sm text-sm">
								Questions ({questions.length})
							</h2>
						</header>
						<div className="flex flex-col gap-3 p-4 px-4 pt-0 group-data-[size=sm]/card:px-3">
							{questions.map((q, _i) => (
								<div
									key={q.id}
									className="flex flex-col gap-2 p-3 px-4 group-data-[size=sm]/card:px-3"
								>
									<div className="flex flex-wrap items-center gap-2">
										<Badge variant="outline" className="text-xs">
											{q.type}
										</Badge>
										<Badge variant="secondary" className="text-xs">
											{q.difficulty}
										</Badge>
										<span className="text-muted-foreground text-xs">
											{q.points} pts
										</span>
									</div>
									<div className="text-sm">
										<MarkdownRenderer
											content={q.questionText}
											subject={subject}
										/>
									</div>
									<div className="line-clamp-2 text-muted-foreground text-xs">
										Hint: {q.hint}
										<div className="flex flex-wrap gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleGrade(q)}
												disabled={!!grading[q.id]}
											>
												{grading[q.id]
													? `Score: ${grading[q.id].score}`
													: "Test Grade"}
											</Button>
											{q.steps && q.steps.length > 0 && (
												<Badge variant="secondary" className="text-xs">
													{q.steps.length} steps
												</Badge>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>

					<div className="overflow-hidden rounded-card-lg border border-border/80 bg-card shadow-level-2 transition-colors">
						<header className="rounded-t-[2.5rem] border-border/80 border-t p-4 pb-2">
							<h2 className="font-heading font-medium text-sm text-sm">
								Raw Response
							</h2>
						</header>
						<div className="p-4 px-4 pt-0 group-data-[size=sm]/card:px-3">
							<Textarea
								value={rawJson}
								readOnly
								className="min-h-[200px] font-mono text-xs"
							/>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
