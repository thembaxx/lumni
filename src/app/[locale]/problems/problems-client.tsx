"use client";

import {
	ArrowDown01Icon,
	BookOpen01Icon,
	LockIcon,
	RadialIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { StepByStep } from "@/components/quiz/step-by-step";
import { Anim } from "@/components/shared/anim";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SubjectSelect } from "@/components/ui/subject-select";
import {
	type CuratedProblem,
	useCuratedProblems,
} from "@/hooks/use-curated-problems";
import { useAuth } from "@/lib/auth/auth-context";
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
		<m.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ delay: index * 0.06, duration: 0.3 }}
			className="overflow-hidden rounded-2xl border border-border bg-card shadow-level-2"
		>
			<div className="p-5">
				<div className="mb-3 flex items-center justify-between gap-3">
					<Badge
						variant="outline"
						className={cn("border-0 font-mono text-xs", difficultyColor)}
					>
						{problem.difficulty}
					</Badge>
					<span className="font-mono text-muted-foreground/50 text-xs">
						#{index + 1}
					</span>
				</div>

				<div className="font-medium text-foreground text-sm leading-relaxed">
					<MarkdownRenderer content={problem.questionText} />
				</div>

				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowSolution(!showSolution)}
					className="mt-4 h-8 gap-2 rounded-lg px-3 text-xs"
				>
					{showSolution ? "Hide" : "Show"} Solution
					<HugeiconsIcon
						icon={ArrowDown01Icon}
						className={cn(
							"size-3 transition-transform",
							showSolution && "rotate-180",
						)}
						data-icon
					/>
				</Button>

				<AnimatePresence initial={false}>
					{showSolution && (
						<m.div
							initial={{ opacity: 0, height: 0 }}
							animate={{ opacity: 1, height: "auto" }}
							exit={{ opacity: 0, height: 0 }}
							className="overflow-hidden"
						>
							<div className="mt-4 flex flex-col gap-4 border-border/50 border-t pt-4">
								<div className="rounded-xl border border-border/50 bg-system-background p-4">
									<p className="mb-2 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
										Solution
									</p>
									<div className="text-foreground/80 text-sm leading-relaxed">
										<MarkdownRenderer content={problem.solution} />
									</div>
								</div>

								{problem.steps && problem.steps.length > 0 && (
									<div>
										<p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-wider">
											Steps
										</p>
										<StepByStep steps={problem.steps} />
									</div>
								)}
							</div>
						</m.div>
					)}
				</AnimatePresence>
			</div>
		</m.div>
	);
}

export function ProblemsClient() {
	const { user, isAnonymous } = useAuth();
	const isLoggedIn = !!user && !isAnonymous;

	const [selectedSubject, setSelectedSubject] = useState("");
	const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
	const [problemCount, setProblemCount] = useState(5);

	const { data, isPending, error, mutate } = useCuratedProblems();

	const [fetched, setFetched] = useState(false);

	const filteredProblems = useMemo(() => {
		if (!data?.problems) return [];
		if (selectedDifficulty === "all") return data.problems;
		return data.problems.filter(
			(p) => p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase(),
		);
	}, [data, selectedDifficulty]);

	const handleGenerate = async () => {
		if (!selectedSubject) return;
		setFetched(true);
		mutate({ subject: selectedSubject, count: problemCount });
	};

	if (!isLoggedIn) {
		return (
			<div className="flex min-h-dvh flex-col items-center justify-center px-4 py-16 text-center">
				<div className="relative mb-6">
					<div className="absolute inset-0 rounded-full bg-muted/50 blur-xl" />
					<div className="relative flex size-20 items-center justify-center rounded-full border border-muted-foreground/30 border-dashed bg-muted/30">
						<HugeiconsIcon
							icon={LockIcon}
							className="size-8 text-muted-foreground/60"
						/>
					</div>
				</div>
				<h3 className="balance mb-2 w-full text-wrap text-center font-extrabold text-xl">
					Sign in to access the Problem Library
				</h3>
				<p className="mb-6 max-w-md text-muted-foreground text-sm">
					Create an account or sign in to browse curated practice problems with
					step-by-step solutions.
				</p>
				<div className="flex gap-2">
					<Button
						variant="outline"
						onClick={() => {
							window.location.href = "/auth/sign-up?redirect=/problems";
						}}
					>
						Create Account
					</Button>
					<Button
						onClick={() => {
							window.location.href = "/auth/sign-in?redirect=/problems";
						}}
					>
						Sign In
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-dvh bg-system-grouped pt-4 pb-24">
			<PageContainer className="flex flex-col gap-8">
				<Anim>
					<div className="flex flex-col gap-6">
						<div>
							<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
								Problem Library
							</h1>
							<p className="ios-subhead mt-1.5 text-muted-foreground/60">
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
									disabled={!selectedSubject || isPending}
									className="h-11 shrink-0 gap-2 rounded-xl"
								>
									{isPending ? (
										<HugeiconsIcon
											icon={RadialIcon}
											className="size-4 animate-spin"
											data-icon
										/>
									) : (
										<HugeiconsIcon
											icon={SparklesIcon}
											className="size-4"
											data-icon
										/>
									)}
									Generate
								</Button>
							</div>

							{selectedSubject && (
								<div className="scrollbar-hide flex items-center gap-2 overflow-x-auto">
									{DIFFICULTIES.map((d) => (
										<Button
											key={d}
											variant={selectedDifficulty === d ? "default" : "outline"}
											size="sm"
											onClick={() => setSelectedDifficulty(d)}
											className="h-8 shrink-0 rounded-lg px-3 text-xs"
										>
											{d === "all" ? "All Levels" : d}
										</Button>
									))}
									<div className="ml-auto flex items-center gap-2">
										<span className="text-muted-foreground/50 text-xs">
											Problems:
										</span>
										{[3, 5, 10].map((n) => (
											<Button
												key={n}
												variant={problemCount === n ? "default" : "outline"}
												size="xs"
												onClick={() => setProblemCount(n)}
												className="size-7 rounded-lg p-0 text-xs"
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
						{!fetched && !isPending && (
							<m.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="py-20 text-center"
							>
								<HugeiconsIcon
									icon={BookOpen01Icon}
									className="mx-auto mb-4 size-12 text-muted-foreground/20"
								/>
								<p className="text-muted-foreground/40 text-sm">
									Select a subject and generate curated problems
								</p>
							</m.div>
						)}

						{isPending && (
							<m.div
								key="loading"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								className="flex flex-col gap-4"
							>
								{[1, 2, 3].map((i) => (
									<Skeleton
										key={`skeleton-${i}`}
										className="flex flex-col gap-3 rounded-2xl p-5"
									>
										<div className="h-4 w-16 rounded bg-muted/30" />
										<div className="h-4 w-full rounded bg-muted/30" />
										<div className="h-4 w-3/4 rounded bg-muted/30" />
									</Skeleton>
								))}
							</m.div>
						)}

						{error && (
							<m.div
								key="error"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm"
							>
								Failed to generate problems. Please try again.
							</m.div>
						)}

						{data && !isPending && !error && (
							<m.div
								key="results"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="flex flex-col gap-4"
							>
								<div className="flex items-center justify-between">
									<p className="text-muted-foreground/50 text-xs">
										{filteredProblems.length} of {data.problems.length} problems
										{selectedDifficulty !== "all" && " filtered"}
									</p>
									{isPending && (
										<HugeiconsIcon
											icon={RadialIcon}
											className="size-3.5 animate-spin text-muted-foreground/40"
										/>
									)}
								</div>

								{filteredProblems.length === 0 ? (
									<div className="py-12 text-center">
										<p className="text-muted-foreground/40 text-sm">
											No problems match the selected difficulty.
										</p>
									</div>
								) : (
									filteredProblems.map((problem, i) => (
										<ProblemCard key={problem.id} problem={problem} index={i} />
									))
								)}
							</m.div>
						)}
					</AnimatePresence>
				</Anim>
			</PageContainer>
		</div>
	);
}
