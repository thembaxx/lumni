"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/markdown-renderer";
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
		"any", "multiple-choice", "matching", "short-answer", "long-answer",
		"essay", "calculation", "diagram", "programming",
		"source-based", "data-response", "mixed",
	];

	return (
		<div className="min-h-screen bg-background p-4 max-w-4xl mx-auto space-y-4 pb-20">
			<h1 className="text-xl font-bold">Engine Integration Test</h1>

			<Card>
				<CardContent className="p-4 space-y-3">
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
						<Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
						<Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Topic (optional)" />
						<Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min={1} max={20} placeholder="Count" />
						<select
							value={questionType}
							onChange={(e) => setQuestionType(e.target.value)}
							className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
						>
							{types.map((t) => <option key={t} value={t}>{t}</option>)}
						</select>
					</div>
					<Button onClick={handleGenerate} disabled={isLoading} className="w-full">
						{isLoading ? "Generating..." : "Generate"}
					</Button>
				</CardContent>
			</Card>

			{error && (
				<Card className="border-destructive">
					<CardContent className="p-4 text-destructive text-sm">{error}</CardContent>
				</Card>
			)}

			{isLoading && <Skeleton className="h-48 w-full" />}

			{questions.length > 0 && (
				<>
					<Card>
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm">Questions ({questions.length})</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0 space-y-3">
							{questions.map((q, i) => (
								<Card key={q.id}>
									<CardContent className="p-3 space-y-2">
										<div className="flex items-center gap-2 flex-wrap">
											<Badge variant="outline" className="text-xs">{q.type}</Badge>
											<Badge variant="secondary" className="text-xs">{q.difficulty}</Badge>
											<span className="text-xs text-muted-foreground">{q.points} pts</span>
										</div>
										<div className="text-sm">
											<MarkdownRenderer content={q.questionText} subject={subject} />
										</div>
										<div className="text-xs text-muted-foreground line-clamp-2">Hint: {q.hint}</div>
										<div className="flex gap-2 flex-wrap">
											<Button size="sm" variant="outline" onClick={() => handleGrade(q)} disabled={!!grading[q.id]}>
												{grading[q.id] ? `Score: ${grading[q.id].score}` : "Test Grade"}
											</Button>
											{q.steps && q.steps.length > 0 && (
												<Badge variant="secondary" className="text-xs">{q.steps.length} steps</Badge>
											)}
										</div>
									</CardContent>
								</Card>
							))}
						</CardContent>
					</Card>

					<Card>
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm">Raw Response</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0">
							<Textarea
								value={rawJson}
								readOnly
								className="min-h-[200px] font-mono text-xs"
							/>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
