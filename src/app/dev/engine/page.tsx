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
import type { GradingResult, Question } from "@/types/questions";

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
			const res = await fetch("/api/engine/generate", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					subject,
					topic: topic || undefined,
					count,
					questionType: questionType === "any" ? "any" : questionType,
				}),
			});
			const data = await res.json();
			setRawJson(JSON.stringify(data, null, 2));
			if (data.questions) {
				setQuestions(data.questions);
			}
			if (!res.ok) setError(data.error || "Generation failed");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
		}
		setIsLoading(false);
	}, [subject, topic, count, questionType]);

	const handleGrade = useCallback(async (q: Question) => {
		const res = await fetch("/api/engine/grade", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				question: q,
				answer: { type: "text", value: "test answer" },
			}),
		});
		const result = await res.json();
		setGrading((prev) => ({ ...prev, [q.id]: result }));
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
		<div className="min-h-[100dvh] bg-background p-4 max-w-4xl mx-auto space-y-4 pb-20">
			<h1 className="text-xl font-extrabold">Engine Integration Test</h1>

			<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
				<div className="px-4 group-data-[size=sm]/card:px-3 p-4 space-y-3">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
				<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors border-destructive">
					<div className="px-4 group-data-[size=sm]/card:px-3 p-4 text-destructive text-sm">
						{error}
					</div>
				</div>
			)}

			{isLoading && <Skeleton className="h-48 w-full" />}

			{questions.length > 0 && (
				<>
					<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
						<header className="rounded-t-[2.5rem] border-t border-border/80 p-4 pb-2">
							<h2 className="font-heading text-sm font-medium text-sm">
								Questions ({questions.length})
							</h2>
						</header>
						<div className="px-4 group-data-[size=sm]/card:px-3 p-4 pt-0 space-y-3">
							{questions.map((q, i) => (
								<div
									key={q.id}
									className="px-4 group-data-[size=sm]/card:px-3 p-3 space-y-2"
								>
									<div className="flex items-center gap-2 flex-wrap">
										<Badge variant="outline" className="text-xs">
											{q.type}
										</Badge>
										<Badge variant="secondary" className="text-xs">
											{q.difficulty}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{q.points} pts
										</span>
									</div>
									<div className="text-sm">
										<MarkdownRenderer
											content={q.questionText}
											subject={subject}
										/>
									</div>
									<div className="text-xs text-muted-foreground line-clamp-2">
										Hint: {q.hint}
										<div className="flex gap-2 flex-wrap">
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

					<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors">
						<header className="rounded-t-[2.5rem] border-t border-border/80 p-4 pb-2">
							<h2 className="font-heading text-sm font-medium text-sm">
								Raw Response
							</h2>
						</header>
						<div className="px-4 group-data-[size=sm]/card:px-3 p-4 pt-0">
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
