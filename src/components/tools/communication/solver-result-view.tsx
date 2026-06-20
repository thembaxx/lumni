"use client";
import {
	BookOpen02Icon,
	CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Button } from "@/components/ui/button";
import { flashcardEngine } from "@/lib/flashcard-engine";
import { VerifiedByPill } from "./verified-by-pill";

interface SolverResultViewProps {
	subject: string;
	result: {
		solution: string;
		steps: string[];
		provider: string;
		sources?: { url: string; title: string }[];
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
	const [flashcardCreated, setFlashcardCreated] = useState(false);
	const [creatingFlashcard, setCreatingFlashcard] = useState(false);

	const handleCreateFlashcard = async () => {
		setCreatingFlashcard(true);
		try {
			await flashcardEngine.create(
				`${SUBJECT_LABELS[subject] || subject} problem`,
				result.solution,
				"mathematics",
			);
			setFlashcardCreated(true);
		} finally {
			setCreatingFlashcard(false);
		}
	};

	return (
		<div className="animate-fade-in-up px-5 pb-10">
			<div className="overflow-hidden rounded-card border border-border bg-card shadow-level-2">
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

					<VerifiedByPill sources={result.sources ?? []} />
				</div>
			</div>

			<div className="mt-4 flex gap-3">
				<Button
					variant="secondary"
					onClick={handleCreateFlashcard}
					disabled={creatingFlashcard || flashcardCreated}
					className="min-h-12 flex-1 gap-2 rounded-xl"
				>
					<HugeiconsIcon
						icon={flashcardCreated ? CheckmarkCircle01Icon : BookOpen02Icon}
						className="size-4"
					/>
					{creatingFlashcard
						? "Creating…"
						: flashcardCreated
							? "Flashcard Created"
							: "Create Flashcard"}
				</Button>
			</div>

			<Button
				variant="outline"
				onClick={onReset}
				className="mt-2 h-10 w-full gap-2 rounded-xl"
			>
				Solve Another Problem
			</Button>
		</div>
	);
}
