"use client";

import { useCallback, useState } from "react";
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
	"MusicNote",
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
		<div className="min-h-[100dvh] bg-background p-4 max-w-4xl mx-auto space-y-4 pb-20">
			<h1 className="text-xl font-bold">Visual Engine Test</h1>

			<div className="rounded-[2.5rem] bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
				<div className="p-4 space-y-3">
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
				</div>
			</div>

			{error && (
				<div className="rounded-[2.5rem] border border-destructive bg-destructive/5 overflow-hidden">
					<div className="p-4 text-destructive text-sm">{error}</div>
				</div>
			)}

			{testResult && (
				<div className="rounded-[2.5rem] bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
					<div className="p-4 pb-2">
						<h3 className="text-sm font-bold tracking-tight">Test Results</h3>
					</div>
					<div className="p-4 pt-0">
						<Textarea
							value={testResult}
							readOnly
							className="min-h-[200px] font-mono text-xs"
						/>
					</div>
				</div>
			)}

			{isLoading && !testResult && <Skeleton className="h-48 w-full" />}

			{visual && (
				<>
					<div className="rounded-[2.5rem] bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
						<div className="p-4 pb-2">
							<h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
								Rendered Visual
								<Badge variant="secondary" className="text-xs">
									{visual.type}
								</Badge>
								{visual.diagramType && (
									<Badge variant="outline" className="text-xs">
										{visual.diagramType}
									</Badge>
								)}
							</h3>
						</div>
						<div className="p-4 pt-0">
							<VisualContent visual={visual} />
						</div>
					</div>

					<div className="rounded-[2.5rem] bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
						<div className="p-4 pb-2">
							<h3 className="text-sm font-bold tracking-tight">Raw Response</h3>
						</div>
						<div className="p-4 pt-0">
							<Textarea
								value={rawJson}
								readOnly
								className="min-h-[150px] font-mono text-xs"
							/>
						</div>
					</div>
				</>
			)}

			{!visual && !isLoading && !error && !testResult && (
				<div className="rounded-[2.5rem] bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] overflow-hidden">
					<div className="p-8 text-center text-sm text-muted-foreground">
						Enter a question above and click "Resolve Visual" to see the result.
						Use "Run All Tests" to test all subjects at once.
					</div>
				</div>
			)}
		</div>
	);
}
