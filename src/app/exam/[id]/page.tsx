"use client";

import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ExamEngine } from "@/components/exam/exam-engine";
import { Button } from "@/components/ui/button";
import type { ExamPaper } from "@/types/exam-paper";

interface PageProps {
	params: Promise<{ id: string }>;
}

interface FetchResult {
	metadata: {
		id: string;
		subject: string;
		paperCode: string;
		examPeriod: string;
		year: number;
		grade: number;
		language: string;
		totalMarks: number;
		duration: string;
	};
	exam: ExamPaper;
}

function parseDuration(duration: string): number {
	const h = duration.match(/(\d+)\s*hour/);
	const m = duration.match(/(\d+)\s*min/);
	let total = 0;
	if (h) total += parseInt(h[1], 10) * 60;
	if (m) total += parseInt(m[1], 10);
	return total || 180;
}

export default function ExamPage({ params }: PageProps) {
	const { id } = use(params);
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [data, setData] = useState<FetchResult | null>(null);

	useEffect(() => {
		async function fetchExam() {
			try {
				const res = await fetch(`/api/exam-papers/${id}`);
				if (!res.ok) {
					const err = await res.json();
					throw new Error(err.error || "Failed to load exam");
				}
				const json = await res.json();
				setData(json);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Failed to load exam");
			} finally {
				setLoading(false);
			}
		}
		fetchExam();
	}, [id]);

	if (loading) {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-3">
					<Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
					<p className="text-sm text-muted-foreground">Loading exam...</p>
				</div>
			</div>
		);
	}

	if (error || !data) {
		return (
			<div className="min-h-dvh flex items-center justify-center bg-background">
				<div className="flex flex-col items-center gap-3 max-w-sm text-center">
					<AlertCircle className="w-10 h-10 text-destructive" />
					<p className="text-sm font-medium">Failed to load exam</p>
					<p className="text-xs text-muted-foreground">{error}</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.push("/dashboard/practice")}
					>
						<ArrowLeft className="w-4 h-4 mr-1" />
						Back to Exams
					</Button>
				</div>
			</div>
		);
	}

	const durationMinutes = parseDuration(data.metadata.duration);

	return (
		<ExamEngine
			paper={data.exam}
			paperId={data.metadata.id}
			durationMinutes={durationMinutes}
		/>
	);
}
