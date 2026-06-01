"use client";

import { ArrowRight01Icon, Lightning } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { QuestionCard } from "@/components/quiz";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuestionEngine } from "@/hooks/use-question-engine";
import type { Question } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";
import { iOSDecelerate } from "@/lib/utils/animation";

type BoltPhase = "loading" | "answering" | "answered" | "branching";

export interface BoltResult {
	question: Question;
	correct: boolean;
}

interface DailyBoltOverlayProps {
	subject: string;
	onComplete: (result: BoltResult) => void;
	onSprint: (result: BoltResult) => void;
	onSkip: () => void;
}

export function DailyBoltOverlay({
	subject,
	onComplete,
	onSprint,
	onSkip,
}: DailyBoltOverlayProps) {
	const [phase, setPhase] = useState<BoltPhase>("loading");
	const [boltResult, setBoltResult] = useState<BoltResult | null>(null);

	const engineParams = useMemo(
		() => ({
			subject: subject.toLowerCase(),
			count: 1,
			questionType: "any" as const,
			difficulty: "Medium" as const,
		}),
		[subject],
	);

	const { questions, isLoading, isError, refetch } = useQuestionEngine(
		engineParams,
		{ enabled: true },
	);

	const question = questions[0];

	useEffect(() => {
		if (!isLoading && question && phase === "loading") {
			setPhase("answering");
		}
	}, [isLoading, question, phase]);

	const handleAnswered = useCallback(
		(correct: boolean) => {
			if (!question) return;
			setBoltResult({ question, correct });
			setPhase("answered");
		},
		[question],
	);

	const handleProceed = useCallback(() => {
		setPhase("branching");
	}, []);

	const skipLabel = phase === "loading" ? "Skip" : "Skip to Dashboard";

	return (
		<div className="fixed inset-0 z-overlay flex flex-col bg-background">
			<div className="flex items-center justify-between px-4 pt-4 pb-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={Lightning} className="size-5 text-amber-500" />
					<span className="font-bold text-base tracking-tight">
						Today's Bolt
					</span>
					<span className="rounded-full bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
						{subject}
					</span>
				</div>
				<button
					type="button"
					onClick={onSkip}
					className="font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
				>
					{skipLabel}
				</button>
			</div>

			<div className="flex flex-1 items-center justify-center px-4 pb-8">
				{phase === "loading" && <BoltLoading />}

				{phase === "answering" && question && (
					<m.div
						key="question"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, ease: iOSDecelerate }}
						className="w-full max-w-2xl"
					>
						<QuestionCard
							question={question}
							subject={subject}
							questionNumber={1}
							totalQuestions={1}
							onNext={handleProceed}
							onAnswered={handleAnswered}
						/>
					</m.div>
				)}

				{phase === "answered" && question && (
					<m.div
						key="question-answered"
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.35, ease: iOSDecelerate }}
						className="w-full max-w-2xl"
					>
						<QuestionCard
							question={question}
							subject={subject}
							questionNumber={1}
							totalQuestions={1}
							onNext={handleProceed}
							onAnswered={handleAnswered}
						/>
					</m.div>
				)}

				{phase === "branching" && boltResult && (
					<BoltBranch
						correct={boltResult.correct}
						onDashboard={() => onComplete(boltResult)}
						onSprint={() => onSprint(boltResult)}
					/>
				)}

				{isError && (
					<div className="flex flex-col items-center gap-4">
						<p className="text-muted-foreground">
							Couldn't load your question. Try again?
						</p>
						<div className="flex gap-3">
							<Button variant="outline" onClick={onSkip}>
								Skip to Dashboard
							</Button>
							<Button onClick={() => refetch()}>Retry</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

function BoltLoading() {
	return (
		<div className="flex w-full max-w-2xl flex-col gap-4">
			<Skeleton className="h-6 w-48 rounded-lg" />
			<Skeleton className="h-48 w-full rounded-3xl" />
			<div className="flex gap-3">
				<Skeleton className="h-12 flex-1 rounded-xl" />
				<Skeleton className="h-12 flex-1 rounded-xl" />
				<Skeleton className="h-12 flex-1 rounded-xl" />
				<Skeleton className="h-12 flex-1 rounded-xl" />
			</div>
		</div>
	);
}

function BoltBranch({
	correct,
	onDashboard,
	onSprint,
}: {
	correct: boolean;
	onDashboard: () => void;
	onSprint: () => void;
}) {
	return (
		<m.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: iOSDecelerate }}
			className="flex w-full max-w-md flex-col items-center gap-6"
		>
			<div className="text-center">
				<p
					className={cn(
						"font-bold text-xl",
						correct ? "text-success" : "text-muted-foreground",
					)}
				>
					{correct ? "Correct!" : "Not quite"}
				</p>
				<p className="mt-1 text-muted-foreground text-sm">
					{correct
						? "Great start to your study session!"
						: "Keep going — practice makes perfect."}
				</p>
			</div>

			<div className="flex w-full flex-col gap-3">
				<Button onClick={onSprint} size="lg" className="w-full gap-2 text-base">
					Continue Sprint
					<HugeiconsIcon icon={ArrowRight01Icon} />
				</Button>
				<Button
					onClick={onDashboard}
					variant="ghost"
					className="w-full text-muted-foreground"
				>
					Back to Dashboard
				</Button>
			</div>
		</m.div>
	);
}
