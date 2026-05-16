"use client";

import {
	BookOpen,
	CaretDown,
	Check,
	Sparkle,
	Spinner,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubjectSelect } from "@/components/ui/subject-select";
import {
	type CuratedProblem,
	useCuratedProblems,
} from "@/hooks/use-curated-problems";
import { cn } from "@/lib/shared";

const DIFFICULTIES = ["all", "Easy", "Medium", "Hard"] as const;

function ProblemCard({
	problem,
	index,
}: {
	problem: CuratedProblem;
	index: number;
}) {
	const [showSolution, setShowSolution] = useState(false);
	const difficultyColor =
		problem.difficulty === "Easy"
			? "text-success bg-success/10"
			: problem.difficulty === "Hard"
				? "text-destructive bg-destructive/10"
				: "text-warning bg-warning/10";

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.3 }}
			className="rounded-2xl border border-border bg-card shadow-level-2 overflow-hidden"
		>
			<div className="p-5">
				<div className="flex items-center justify-between gap-3 mb-3">
					<Badge
						variant="outline"
						className={cn("text-xs font-mono border-0", difficultyColor)}
					>
						{problem.difficulty}
					</Badge>
					<span className="text-xs text-muted-foreground/50 font-mono">
						#{index + 1}
					</span>
				</div>

				<div className="text-sm leading-relaxed text-foreground font-medium">
					<MarkdownRenderer content={problem.questionText} />
				</div>

				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowSolution(!showSolution)}
					className="mt-4 gap-2 h-8 px-3 rounded-lg text-xs"
				>
					{showSolution ? "Hide" : "Show"} Solution
					<CaretDown
						className={cn(
							"size-3 transition-transform",
							showSolution && "rotate-180",
						)}
						data-icon
					/>
				</Button>

				<AnimatePresence initial={false}>
					{showSolution && (
						<motion.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="overflow-hidden"
						>
							<div className="mt-4 pt-4 border-t border-border/50 space-y-4">
								<div className="bg-system-background rounded-xl p-4 border border-border/50">
									<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
										Solution
									</p>
									<div className="text-sm leading-relaxed text-foreground/80">
										<MarkdownRenderer content={problem.solution} />
									</div>
								</div>

								{problem.steps && problem.steps.length > 0 && (
									<div>
										<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
											Steps
										</p>
										<StepByStep steps={problem.steps} />
									</div>
								)}
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</motion.div>
	);
}

function ProblemsClient() {
	const [selectedSubject, setSelectedSubject] = useState("");
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
	const [problemCount, setProblemCount] = useState(5);

	const { data, isLoading, isFetching, error, refetch } = useCuratedProblems({
		subject: selectedSubject,
		count: problemCount,
		enabled: false,
	});

	const [fetched, setFetched] = useState(false);

	const handleGenerate = async () => {
		if (!selectedSubject) return;
		setFetched(true);
		refetch();
	};

	const filteredProblems = useMemo(() => {
		if (!data?.problems) return [];
		if (selectedDifficulty === "all") return data.problems;
		return data.problems.filter(
			(p) => p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
		);
	}, [data, selectedDifficulty]);

	return (
		<div className="min-h-[100dvh] bg-system-grouped pt-4 pb-24">
			<div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-8">
				<Anim>
					<div className="flex flex-col gap-6">
						<div>
							<h1 className="ios-title-1 font-extrabold text-foreground tracking-tight">
								Problem Library
							</h1>
							<p className="ios-subhead text-muted-foreground/60 mt-1.5">
								Browse curated practice problems with step-by-step solutions
							</p>
						</div>

						<div className="flex flex-col gap-4">
							<div className="flex items-center gap-3">
								<div className="flex-1">
									<SubjectSelect
										value={selectedSubject}
										onChange={setSelectedSubject}
									/>
								</div>
								<Button
									onClick={handleGenerate}
									disabled={!selectedSubject || isLoading}
									className="gap-2 h-11 rounded-xl shrink-0"
								>
									{isLoading ? (
										<Spinner className="size-4 animate-spin" data-icon />
									) : (
										<Sparkle className="size-4" data-icon />
									)}
									Generate
								</Button>
							</div>

							{selectedSubject && (
								<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
									{DIFFICULTIES.map((d) => (
										<Button
											key={d}
											variant={selectedDifficulty === d ? "default" : "outline"}
											size="sm"
											onClick={() => setSelectedDifficulty(d)}
											className="text-xs h-8 px-3 rounded-lg shrink-0"
										>
											{d === "all" ? "All Levels" : d}
										</Button>
									))}
									<div className="ml-auto flex items-center gap-2">
										<span className="text-xs text-muted-foreground/50">
											Problems:
										</span>
										{[3, 5, 10].map((n) => (
											<Button
												key={n}
												variant={problemCount === n ? "default" : "outline"}
												size="xs"
												onClick={() => setProblemCount(n)}
												className="text-xs h-7 w-7 p-0 rounded-lg"
											>
												{n}
											</Button>
										))}
									</div>
								</div>
							)}
						</div>
					</div>

					<AnimatePresence mode="wait" initial={false}>
						{!fetched && !isLoading && (
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="text-center py-20"
							>
								<BookOpen className="size-12 mx-auto text-muted-foreground/20 mb-4" />
								<p className="text-sm text-muted-foreground/40">
									Select a subject and generate curated problems
								</p>
							</motion.div>
						)}

						{isLoading && (
							<motion.div
								key="loading"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="space-y-4"
							>
								{[1, 2, 3].map((i) => (
									<div
										key={i}
										className="rounded-2xl border border-border/50 bg-card p-5 animate-pulse space-y-3"
									>
										<div className="h-4 bg-muted/30 rounded w-16" />
										<div className="h-4 bg-muted/30 rounded w-full" />
										<div className="h-4 bg-muted/30 rounded w-3/4" />
									</div>
								))}
							</motion.div>
						)}

						{error && (
							<motion.div
								key="error"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="bg-destructive/10 text-destructive text-sm p-4 rounded-xl border border-destructive/20"
							>
								Failed to generate problems. Please try again.
							</motion.div>
						)}

						{data && !isLoading && !error && (
							<motion.div
								key="results"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="flex flex-col gap-4"
							>
								<div className="flex items-center justify-between">
									<p className="text-xs text-muted-foreground/50">
										{filteredProblems.length} of {data.problems.length} problems
										{selectedDifficulty !== "all" && " filtered"}
									</p>
									{isFetching && (
										<Spinner className="size-3.5 animate-spin text-muted-foreground/40" />
									)}
								</div>

								{filteredProblems.length === 0 ? (
									<div className="text-center py-12">
										<p className="text-sm text-muted-foreground/40">
											No problems match the selected difficulty.
										</p>
									</div>
								) : (
									filteredProblems.map((problem, i) => (
										<ProblemCard key={problem.id} problem={problem} index={i} />
									))
								)}
							</motion.div>
						)}
					</AnimatePresence>
				</Anim>
			</div>
		</div>
	);
}

export default function ProblemsPage() {
	return <ProblemsClient />;
}
