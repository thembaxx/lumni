"use client";

import {
	AlertCircleIcon,
	ArrowRight01Icon,
	BookOpenIcon,
	RefreshIcon,
	Rocket01Icon,
	SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuestionCard } from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import { offlineDB } from "@/lib/db/schema";
import type { Question } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSDecelerate, iOSEase } from "@/lib/utils/animation";

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

interface DailyBoltOverlayProps {
	onComplete: (result: BoltResult) => void;
	onSprint: (result: BoltResult) => void;
	onSkip: () => void;
}

async function resolveWeakestSubject(): Promise<string> {
	try {
		const all = await offlineDB.competencies.toArray();
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

export function DailyBoltOverlay({
	onComplete,
	onSprint,
	onSkip,
}: DailyBoltOverlayProps) {
	const [phase, setPhase] = useState<BoltPhase>("resolving");
	const [subject, setSubject] = useState("mathematics");
	const [boltResult, setBoltResult] = useState<BoltResult | null>(null);
	const shouldReduceMotion = useReducedMotion();
	const celebrationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		resolveWeakestSubject().then((s) => {
			setSubject(s);
			setPhase("loading");
		});
	}, []);

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
		useQuestionEngine(engineParams, { enabled: phase === "loading" });

	const question = questions[0];
	const subjectLabel = useMemo(() => formatSubjectLabel(subject), [subject]);

	useEffect(() => {
		if (phase !== "loading") return;
		if (isLoading) return;
		if (isError) {
			setPhase("error");
			return;
		}
		if (question) {
			setPhase("answering");
		} else if (!isFetching) {
			setPhase("empty");
		}
	}, [isLoading, isError, question, isFetching, phase]);

	const handleAnswered = useCallback(
		(correct: boolean) => {
			if (!question) return;
			setBoltResult({ question, correct });
			celebrationTimerRef.current = setTimeout(() => {
				setPhase("celebrating");
			}, 800);
		},
		[question],
	);

	const handleProceed = useCallback(() => {
		if (!boltResult) return;
		onComplete(boltResult);
	}, [boltResult, onComplete]);

	const handleSprintFromCelebration = useCallback(() => {
		if (!boltResult) return;
		onSprint(boltResult);
	}, [boltResult, onSprint]);

	useEffect(() => {
		return () => {
			if (celebrationTimerRef.current) {
				clearTimeout(celebrationTimerRef.current);
			}
		};
	}, []);

	const handleRetry = useCallback(() => {
		setPhase("loading");
		void refetch();
	}, [refetch]);

	const skipLabel =
		phase === "resolving" || phase === "loading" ? "Skip" : "Skip to Dashboard";

	const showLoading = phase === "resolving" || phase === "loading";
	const showError = phase === "error";
	const showEmpty = phase === "empty";

	return (
		<div className="fixed inset-0 z-overlay flex flex-col overflow-hidden bg-system-background">
			<BoltAmbientBackground reduceMotion={shouldReduceMotion ?? false} />

			<header className="relative z-10 flex items-center justify-between gap-3 px-5 pt-5 pb-3">
				<div className="flex min-w-0 items-center gap-2.5">
					<BoltMark reduceMotion={shouldReduceMotion ?? false} />
					<div className="flex min-w-0 flex-col">
						<span className="font-extrabold font-heading text-base text-system-text-primary tracking-tight">
							Today&rsquo;s Bolt
						</span>
						{showLoading ? (
							<span
								key="loading-subject"
								className="truncate text-muted-foreground text-xs"
							>
								Finding your focus&hellip;
							</span>
						) : (
							<span
								key="subject-label"
								className="truncate text-muted-foreground text-xs"
							>
								{subjectLabel}
							</span>
						)}
					</div>
				</div>
				<button
					type="button"
					onClick={onSkip}
					className="min-h-10 rounded-full px-4 py-2 font-medium text-muted-foreground text-xs transition-[background-color,transform] hover:bg-system-fill hover:text-foreground active:scale-[0.96]"
				>
					{skipLabel}
				</button>
			</header>

			<main className="relative z-10 flex flex-1 flex-col overflow-y-auto px-5 pb-8">
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
							className="flex flex-1 items-center justify-center pt-2"
						>
							<div className="w-full max-w-2xl">
								<QuestionCard
									question={question}
									subject={subject}
									questionNumber={1}
									totalQuestions={1}
									onNext={handleProceed}
									onAnswered={handleAnswered}
								/>
							</div>
						</m.section>
					)}

					{phase === "celebrating" && boltResult && (
						<m.section
							key="celebrating"
							initial={{ opacity: 0, scale: 0.92 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.92 }}
							transition={{ duration: 0.45, ease: iOSDecelerate }}
							className="flex flex-1 items-center justify-center"
						>
							<BoltCelebration
								correct={boltResult.correct}
								subjectLabel={subjectLabel}
								xpReward={boltResult.correct ? 35 : 15}
								onDashboard={() => onComplete(boltResult)}
								onSprint={handleSprintFromCelebration}
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
								onSkip={onSkip}
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
								onSkip={onSkip}
								isRetrying={isFetching}
							/>
						</m.section>
					)}
				</AnimatePresence>
			</main>
		</div>
	);
}

function BoltMark({ reduceMotion }: { reduceMotion: boolean }) {
	return (
		<m.div
			initial={reduceMotion ? false : { scale: 0.6, rotate: -10, opacity: 0 }}
			animate={{ scale: 1, rotate: 0, opacity: 1 }}
			transition={{ duration: 0.55, ease: iOSEase }}
			className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-warning/15 shadow-level-1 ring-1 ring-warning/25"
			aria-hidden="true"
		>
			<m.div
				animate={
					reduceMotion
						? undefined
						: { scale: [1, 1.06, 1], opacity: [0.55, 0.85, 0.55] }
				}
				transition={{
					duration: 2.4,
					repeat: Infinity,
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

function BoltAmbientBackground({ reduceMotion }: { reduceMotion: boolean }) {
	return (
		<div
			className="pointer-events-none absolute inset-0 overflow-hidden"
			aria-hidden="true"
		>
			<div className="absolute inset-0 bg-linear-to-b from-warning/8 via-transparent to-transparent dark:from-warning/6" />
			<m.div
				animate={
					reduceMotion ? undefined : { x: [0, 24, -8, 0], y: [0, -18, 12, 0] }
				}
				transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
				className="absolute -top-32 -right-24 size-72 rounded-full bg-warning/15 blur-3xl"
			/>
			<m.div
				animate={
					reduceMotion ? undefined : { x: [0, -20, 14, 0], y: [0, 16, -10, 0] }
				}
				transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
				className="absolute -bottom-40 -left-20 size-80 rounded-full bg-system-accent/10 blur-3xl"
			/>
		</div>
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
						Charging your bolt
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
	onSkip,
	isRetrying,
}: {
	onRetry: () => void;
	onSkip: () => void;
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
					We couldn&rsquo;t charge your bolt
				</h2>
				<p className="max-w-sm text-balance text-muted-foreground text-sm">
					Something tripped while loading today&rsquo;s question. Give it
					another try, or head back to the dashboard and pick a different start.
				</p>
			</div>
			<div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
				<Button
					variant="outline"
					onClick={onSkip}
					className="w-full sm:w-auto"
					disabled={isRetrying}
				>
					Back to Dashboard
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
					{isRetrying ? "Retrying…" : "Try Again"}
				</Button>
			</div>
		</div>
	);
}

function BoltEmptyState({
	subjectLabel,
	onRetry,
	onSkip,
	isRetrying,
}: {
	subjectLabel: string;
	onRetry: () => void;
	onSkip: () => void;
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
					in a moment, or jump into the dashboard to browse your topics.
				</p>
			</div>
			<div className="flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
				<Button
					variant="outline"
					onClick={onSkip}
					className="w-full sm:w-auto"
					disabled={isRetrying}
				>
					Back to Dashboard
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

function BoltCelebration({
	correct,
	subjectLabel,
	xpReward,
	onDashboard,
	onSprint,
}: {
	correct: boolean;
	subjectLabel: string;
	xpReward: number;
	onDashboard: () => void;
	onSprint: () => void;
}) {
	return (
		<div className="flex w-full max-w-sm flex-col items-center gap-8 text-center">
			<m.div
				initial={{ scale: 0, rotate: -15 }}
				animate={{ scale: 1, rotate: 0 }}
				transition={{ duration: 0.6, ease: iOSDecelerate, delay: 0.1 }}
				className="relative"
			>
				<m.div
					animate={{ scale: [1, 1.08, 1] }}
					transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
					className={cn(
						"absolute inset-0 rounded-full blur-3xl",
						correct ? "bg-success/25" : "bg-warning/20",
					)}
				/>
				<div
					className={cn(
						"relative flex size-24 items-center justify-center rounded-full shadow-level-2 ring-1",
						correct
							? "bg-success/15 text-success ring-success/25"
							: "bg-warning/15 text-warning ring-warning/25",
					)}
				>
					<m.div
						animate={correct ? { rotate: [0, -6, 6, -6, 0] } : undefined}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						<HugeiconsIcon
							icon={correct ? Rocket01Icon : SparklesIcon}
							className="size-10"
							strokeWidth={2}
						/>
					</m.div>
				</div>
			</m.div>

			<m.div
				initial={{ opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: iOSDecelerate, delay: 0.3 }}
				className="flex flex-col gap-2"
			>
				<h2
					className={cn(
						"text-balance font-extrabold font-heading text-2xl tracking-tight",
						correct ? "text-success" : "text-foreground",
					)}
				>
					{correct ? "Bolt delivered" : "Solid attempt"}
				</h2>
				<p className="max-w-xs text-balance text-muted-foreground text-sm leading-relaxed">
					{correct
						? `Nice work on that ${subjectLabel} question.`
						: `Every bolt sharpens you. Keep at it.`}
				</p>
				<p className="font-semibold text-foreground text-xs tabular-nums">
					+{xpReward} XP
				</p>
			</m.div>

			<m.div
				initial={{ opacity: 0, y: 12 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: iOSDecelerate, delay: 0.5 }}
				className="flex w-full flex-col gap-3"
			>
				<Button
					onClick={onDashboard}
					size="lg"
					className="w-full gap-2 text-base"
				>
					Go to Dashboard
				</Button>
				<Button
					onClick={onSprint}
					variant="outline"
					size="lg"
					className="w-full gap-2"
				>
					Continue Sprint
					<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
				</Button>
			</m.div>
		</div>
	);
}
