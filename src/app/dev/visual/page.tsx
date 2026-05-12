"use client";

import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DiagramRenderer } from "@/components/visual/diagram-renderer";
import { ImageViewer } from "@/components/visual/image-viewer";
import { MermaidDiagram } from "@/components/visual/mermaid-diagram";
import { VisualContent } from "@/components/visual/visual-content";
import { STEM_SUBJECTS } from "@/lib/visual-engine";
import type { VisualContent as VisualContentType } from "@/lib/visual-engine/types";

const SUBJECTS = [...STEM_SUBJECTS].sort();
const ALL_SUBJECTS = [
	...SUBJECTS,
	"history",
	"english-home-language",
	"life-orientation",
	"music",
].sort();

export default function DevVisualPage() {
	const [subject, setSubject] = useState("mathematics");
	const [topic, setTopic] = useState("algebra");
	const [questionText, setQuestionText] = useState(
		"Solve for x in the equation $x^2 - 5x + 6 = 0$. Show the parabola graph.",
	);
	const [visual, setVisual] = useState<VisualContentType | null>(null);
	const [rawJson, setRawJson] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const [testResult, setTestResult] = useState<string>("");

	const handleResolve = useCallback(async () => {
		setIsLoading(true);
		setError("");
		setVisual(null);
		setRawJson("");
		try {
			const res = await fetch("/api/engine/visual", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					questionId: `dev-${Date.now()}`,
					questionText,
					subject,
					topic: topic || undefined,
				}),
			});
			const data = await res.json();
			setRawJson(JSON.stringify(data, null, 2));
			if (data.visual) setVisual(data.visual);
			if (!res.ok) setError(data.error || "Resolution failed");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Network error");
		}
		setIsLoading(false);
	}, [questionText, subject, topic]);

	const handleRunTests = useCallback(async () => {
		setIsLoading(true);
		setError("");
		setVisual(null);
		setRawJson("");
		setTestResult("Running tests...");
		try {
			const res = await fetch("/api/engine/visual/test");
			const data = await res.json();
			setTestResult(JSON.stringify(data, null, 2));
		} catch (err) {
			setTestResult(
				`Error: ${err instanceof Error ? err.message : "Network error"}`,
			);
		}
		setIsLoading(false);
	}, []);

	const isSTEM = STEM_SUBJECTS.has(subject);

	return (
		<div className="min-h-screen bg-background p-4 max-w-4xl mx-auto space-y-4 pb-20">
			<h1 className="text-xl font-bold">Visual Engine Test</h1>

			<Card>
				<CardContent className="p-4 space-y-3">
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
						<Select value={subject} onValueChange={(v) => v && setSubject(v)}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{ALL_SUBJECTS.map((s) => (
									<SelectItem key={s} value={s}>
										{s}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							value={topic}
							onChange={(e) => setTopic(e.target.value)}
							placeholder="Topic (optional)"
						/>
						<Button
							onClick={handleResolve}
							disabled={isLoading}
							variant="default"
						>
							{isLoading ? "Resolving..." : "Resolve Visual"}
						</Button>
					</div>
					<Textarea
						value={questionText}
						onChange={(e) => setQuestionText(e.target.value)}
						placeholder="Enter question text..."
						rows={3}
					/>
					<Badge variant="outline" className="text-xs">
						{isSTEM ? "STEM → AI Diagram" : "Non-STEM → Image Search"}
					</Badge>
					<Button
						onClick={handleRunTests}
						variant="outline"
						size="sm"
						disabled={isLoading}
					>
						Run All Tests
					</Button>
				</CardContent>
			</Card>

			{error && (
				<Card className="border-destructive">
					<CardContent className="p-4 text-destructive text-sm">
						{error}
					</CardContent>
				</Card>
			)}

			{testResult && (
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-sm">Test Results</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<Textarea
							value={testResult}
							readOnly
							className="min-h-[200px] font-mono text-xs"
						/>
					</CardContent>
				</Card>
			)}

			{isLoading && !testResult && <Skeleton className="h-48 w-full" />}

			{visual && (
				<>
					<Card>
						<CardHeader className="p-4 pb-2">
							<CardTitle className="text-sm flex items-center gap-2">
								Rendered Visual
								<Badge variant="secondary" className="text-xs">
									{visual.type}
								</Badge>
								{visual.diagramType && (
									<Badge variant="outline" className="text-xs">
										{visual.diagramType}
									</Badge>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent className="p-4 pt-0">
							<VisualContent visual={visual} />
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
								className="min-h-[150px] font-mono text-xs"
							/>
						</CardContent>
					</Card>
				</>
			)}

			{!visual && !isLoading && !error && !testResult && (
				<Card>
					<CardContent className="p-8 text-center text-sm text-muted-foreground">
						Enter a question above and click "Resolve Visual" to see the result.
						Use "Run All Tests" to test all subjects at once.
					</CardContent>
				</Card>
			)}
		</div>
	);
}
