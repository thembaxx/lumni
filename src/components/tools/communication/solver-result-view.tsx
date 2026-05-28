"use client";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Button } from "@/components/ui/button";

interface SolverResultViewProps {
	subject: string;
	result: {
		solution: string;
		steps: string[];
		provider: string;
	};
	onReset: () => void;
}

const SUBJECT_LABELS: Record<string, string> = {
	"pre-algebra": "Pre-Algebra",
	algebra: "Algebra",
	trigonometry: "Trigonometry",
	calculus: "Calculus",
	geometry: "Geometry",
	statistics: "Statistics",
	matrix: "Matrix",
};

export function SolverResultView({
	subject,
	result,
	onReset,
}: SolverResultViewProps) {
	return (
		<div className="animate-fade-in-up px-5 pb-10">
			<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-level-2">
				<div className="p-6">
					{subject !== "general" && (
						<div className="mb-4">
							<span className="rounded-full bg-[--system-accent]/10 px-2.5 py-1 font-medium text-[--system-accent] text-xs">
								{SUBJECT_LABELS[subject] || subject}
							</span>
						</div>
					)}
					<div className="rounded-xl border border-border/50 bg-system-background p-5">
						<div className="prose prose-sm max-w-none text-foreground">
							<MarkdownRenderer
								content={result.solution}
								subject="mathematics"
							/>
						</div>
					</div>

					{result.steps && result.steps.length > 0 && (
						<div className="mt-6">
							<p className="mb-4 font-bold text-muted-foreground text-xs uppercase tracking-wider">
								Steps
							</p>
							<StepByStep steps={result.steps} />
						</div>
					)}
				</div>
			</div>

			<Button
				variant="outline"
				onClick={onReset}
				className="mt-4 h-10 w-full gap-2 rounded-xl"
			>
				Solve Another Problem
			</Button>
		</div>
	);
}
