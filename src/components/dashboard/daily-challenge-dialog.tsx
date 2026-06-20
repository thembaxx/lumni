"use client";

import {
	AlertCircleIcon,
	BookOpenIcon,
	RefreshIcon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { BoltCelebration } from "@/components/dashboard/bolt-celebration";
import { QuestionCard } from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { Question } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSDecelerate, iOSEase } from "@/lib/utils/animation";
import { _deps } from "./daily-challenge-dialog-deps";

type BoltPhase =
	| "resolving"
	| "loading"
	| "answering"
	| "celebrating"
	| "error"
	| "empty";

export interface BoltResult {
	question: Question;
	correct: boolean;
}

interface DailyChallengeDialogProps {
	subject: string;
	onComplete: (result: BoltResult) => void;
	onClose: () => void;
	streak: number;
}

export async function resolveWeakestSubject(): Promise<string> {
	try {
		const all = await _deps.db.competencies.toArray();
		if (all.length === 0) return "mathematics";

		const bySubject = new Map<string, number[]>();
		for (const record of all) {
			const scores = bySubject.get(record.subjectId) ?? [];
			scores.push(record.score);
			bySubject.set(record.subjectId, scores);
		}

		let weakest = "mathematics";
		let lowestAvg = Infinity;
		for (const [subject, scores] of bySubject) {
			const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
			if (avg < lowestAvg) {
				lowestAvg = avg;
				weakest = subject;
			}
		}
		return weakest;
	} catch {
		return "mathematics";
	}
}

function formatSubjectLabel(subject: string): string {
	return subject
		.split(/[-_\s]+/)
		.filter(Boolean)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

export function DailyChallengeDialog({
	subject,
	onComplete,
	onClose,
	streak,
}: DailyChallengeDialogProps) {
	const [boltResult, setBoltResult] = useState<BoltResult | null>(null);
	const [isCelebrating, setIsCelebrating] = useState(false);

	const engineParams = useMemo(
		() => ({
			subject: subject.toLowerCase(),
			count: 1,
			questionType: "any" as const,
			difficulty: "Medium" as const,
		}),
		[subject],
	);

	const { questions, isLoading, isError, refetch, isFetching } =
		useQuestionEngine(engineParams, { enabled: true });

	const question = questions[0];
	const subjectLabel = useMemo(() => formatSubjectLabel(subject), [subject]);

	const phase: BoltPhase = isCelebrating
		? "celebrating"
		: isLoading
			? "loading"
			: isError
				? "error"
				: question
					? "answering"
					: !isFetching
						? "empty"
						: "loading";

	const handleAnswered = useCallback(
		(correct: boolean) => {
			if (!question) return;
			setBoltResult({ question, correct });
		},
		[question],
	);

	const handleFinish = useCallback(() => {
		setIsCelebrating(true);
	}, []);

	const handleRetry = useCallback(() => {
		void refetch();
	}, [refetch]);

	const showLoading = phase === "loading";
	const showError = phase === "error";
	const showEmpty = phase === "empty";
	const showCelebrating = phase === "celebrating";

	return (
		<div className="flex flex-col overflow-hidden rounded-2xl">
			<header className="flex items-center gap-2.5 px-5 pt-5 pb-3">
				<BoltMark />
				<div className="flex min-w-0 flex-col">
					<span className="font-extrabold text-base text-system-text-primary tracking-tight">
						Today&rsquo;s Challenge
					</span>
					<span className="truncate text-muted-foreground text-xs">
						{subjectLabel}
					</span>
				</div>
			</header>

			<main className="flex flex-1 flex-col overflow-y-auto px-5 pb-8">
				<AnimatePresence mode="wait" initial={false}>
					{showLoading && (
						<m.section
							key="loading"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.35, ease: iOSDecelerate }}
							className="flex flex-1 items-center justify-center"
						>
							<BoltLoading subjectLabel={subjectLabel} />
						</m.section>
					)}

					{phase === "answering" && question && (
						<m.section
							key="question"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.4, ease: iOSDecelerate }}
							className="flex flex-1 flex-col items-center justify-center pt-2"
						>
							<div className="w-full max-w-2xl">
								<QuestionCard
									question={question}
									subject={subject}
									questionNumber={1}
									totalQuestions={1}
									onAnswered={handleAnswered}
								/>
							</div>
							{boltResult && (
								<div className="sticky bottom-0 z-content -mx-5 mt-4 self-stretch border-system-separator border-t bg-system-background/90 px-5 py-4 backdrop-blur-xl">
									<div className="mx-auto w-full max-w-2xl">
										<Button
											onClick={handleFinish}
											size="lg"
											className="w-full gap-2 text-base"
										>
											Finish
										</Button>
									</div>
								</div>
							)}
						</m.section>
					)}

					{showCelebrating && (
						<m.section
							key="celebrating"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.4, ease: iOSDecelerate }}
							className="flex flex-1 items-center justify-center pt-2"
						>
							<BoltCelebration
								correct={boltResult?.correct ?? false}
								subjectLabel={subjectLabel}
								streak={streak}
								onContinue={() => {
									if (boltResult) onComplete(boltResult);
									onClose();
								}}
							/>
						</m.section>
					)}

					{showError && (
						<m.section
							key="error"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.4, ease: iOSDecelerate }}
							className="flex flex-1 items-center justify-center"
						>
							<BoltErrorState
								onRetry={handleRetry}
								onClose={onClose}
								isRetrying={isFetching}
							/>
						</m.section>
					)}

					{showEmpty && (
						<m.section
							key="empty"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -8 }}
							transition={{ duration: 0.4, ease: iOSDecelerate }}
							className="flex flex-1 items-center justify-center"
						>
							<BoltEmptyState
								subjectLabel={subjectLabel}
								onRetry={handleRetry}
								onClose={onClose}
								isRetrying={isFetching}
							/>
						</m.section>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}

function BoltMark() {
	return (
		<m.div
			initial={{ scale: 0.6, rotate: -10, opacity: 0 }}
			animate={{ scale: 1, rotate: 0, opacity: 1 }}
			transition={{ duration: 0.55, ease: iOSEase }}
			className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 shadow-level-1 ring-1 ring-warning/25"
			aria-hidden="true"
		>
			<m.div
				animate={{ scale: [1, 1.06, 1], opacity: [0.55, 0.85, 0.55] }}
				transition={{
					duration: 2.4,
					repeat: 2,
					ease: "easeInOut",
				}}
				className="absolute inset-0 rounded-2xl bg-warning/30 blur-md"
			/>
			<HugeiconsIcon
				icon={SparklesIcon}
				className="relative size-5 text-warning"
				strokeWidth={2.25}
			/>
		</m.div>
	);
}

function BoltLoading({ subjectLabel }: { subjectLabel: string }) {
	return (
		<div className="flex w-full max-w-2xl flex-col gap-5">
			<div className="flex flex-col items-center gap-3 py-2 text-center">
				<div className="flex items-center gap-2 rounded-full bg-system-fill px-3 py-1.5">
					<span className="relative flex size-2">
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-warning/60" />
						<span className="relative inline-flex size-2 rounded-full bg-warning" />
					</span>
					<span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
						Loading your challenge
					</span>
				</div>
				<h2 className="ios-title-3 max-w-md text-balance text-foreground">
					Preparing a {subjectLabel} question
				</h2>
				<p className="max-w-sm text-balance text-muted-foreground text-sm">
					Sharpening today&rsquo;s target at your weakest spot.
				</p>
			</div>
			<Skeleton className="h-6 w-48 rounded-full" />
			<Skeleton className="h-44 w-full rounded-3xl" />
			<div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
				<Skeleton className="h-14 rounded-2xl" />
				<Skeleton className="h-14 rounded-2xl" />
				<Skeleton className="h-14 rounded-2xl" />
				<Skeleton className="h-14 rounded-2xl" />
			</div>
		</div>
	);
}

function BoltErrorState({
	onRetry,
	onClose,
	isRetrying,
}: {
	onRetry: () => void;
	onClose: () => void;
	isRetrying: boolean;
}) {
	return (
		<div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
			<div className="relative flex size-16 items-center justify-center rounded-3xl bg-destructive/10 ring-1 ring-destructive/20">
				<div className="absolute inset-0 rounded-3xl bg-destructive/20 blur-xl" />
				<HugeiconsIcon
					icon={AlertCircleIcon}
					className="relative size-7 text-destructive"
					strokeWidth={2}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="ios-title-3 text-balance text-foreground">
					We couldn&rsquo;t load your challenge
				</h2>
				<p className="max-w-sm text-balance text-muted-foreground text-sm">
					Something tripped while loading today&rsquo;s question. Give it
					another try, or close and pick a different start.
				</p>
			</div>
			<div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
				<Button
					variant="outline"
					onClick={onClose}
					className="w-full sm:w-auto"
					disabled={isRetrying}
				>
					Close
				</Button>
				<Button
					onClick={onRetry}
					className="w-full gap-2 sm:w-auto"
					disabled={isRetrying}
				>
					<HugeiconsIcon
						icon={RefreshIcon}
						className={cn("size-4", isRetrying && "animate-spin")}
					/>
					{isRetrying ? "Retrying…" : "Try again"}
				</Button>
			</div>
		</div>
	);
}

function BoltEmptyState({
	subjectLabel,
	onRetry,
	onClose,
	isRetrying,
}: {
	subjectLabel: string;
	onRetry: () => void;
	onClose: () => void;
	isRetrying: boolean;
}) {
	return (
		<div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
			<div className="relative flex size-16 items-center justify-center rounded-3xl bg-system-fill ring-1 ring-system-separator">
				<HugeiconsIcon
					icon={BookOpenIcon}
					className="relative size-7 text-muted-foreground"
					strokeWidth={2}
				/>
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="ios-title-3 text-balance text-foreground">
					No {subjectLabel} question ready yet
				</h2>
				<p className="max-w-sm text-balance text-muted-foreground text-sm">
					We couldn&rsquo;t pull a fresh question for you right now. Try again
					in a moment, or close and browse your topics.
				</p>
			</div>
			<div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
				<Button
					variant="outline"
					onClick={onClose}
					className="w-full sm:w-auto"
					disabled={isRetrying}
				>
					Close
				</Button>
				<Button
					onClick={onRetry}
					className="w-full gap-2 sm:w-auto"
					disabled={isRetrying}
				>
					<HugeiconsIcon
						icon={RefreshIcon}
						className={cn("size-4", isRetrying && "animate-spin")}
					/>
					{isRetrying ? "Refreshing…" : "Refresh Question"}
				</Button>
			</div>
		</div>
	);
}
