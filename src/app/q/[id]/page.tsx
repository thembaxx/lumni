"use client";

import { StarIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { VerifiedByPill } from "@/components/tools/communication/verified-by-pill";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Question } from "@/lib/question-engine/types";
import { cn } from "@/lib/shared";

interface FetchedData {
	id: string;
	question: Question;
	subject: string;
	topic: string;
	sharedAt: number;
	sources?: { url: string; title: string }[];
}

const RATING_KEY = "lumni_question_ratings";

function getStoredRating(id: string): number {
	try {
		const raw = localStorage.getItem(RATING_KEY);
		if (!raw) return 0;
		const ratings = JSON.parse(raw) as Record<string, number>;
		return ratings[id] ?? 0;
	} catch {
		return 0;
	}
}

function storeRating(id: string, rating: number): void {
	try {
		const raw = localStorage.getItem(RATING_KEY);
		const ratings = raw ? (JSON.parse(raw) as Record<string, number>) : {};
		ratings[id] = rating;
		localStorage.setItem(RATING_KEY, JSON.stringify(ratings));
	} catch {
		/* silent */
	}
}

export default function SharedQuestionPage() {
	const { id } = useParams<{ id: string }>();
	const [data, setData] = useState<FetchedData | null>(null);
	const [loading, setLoading] = useState(true);
	const [notFound, setNotFound] = useState(false);
	const [rating, setRating] = useState(0);
	const [submittedRating, setSubmittedRating] = useState(0);
	const [showAnswer, setShowAnswer] = useState(false);

	const questionId = id;

	useEffect(() => {
		if (!questionId) return;
		const stored = getStoredRating(questionId);
		if (stored > 0) {
			setRating(stored);
			setSubmittedRating(stored);
			setShowAnswer(stored >= 3);
		}
	}, [questionId]);

	useEffect(() => {
		if (!questionId) return;
		fetch(`/api/q/${questionId}`)
			.then((r) => {
				if (!r.ok) throw new Error("not found");
				return r.json() as Promise<FetchedData>;
			})
			.then((d) => {
				setData(d);
				setLoading(false);
			})
			.catch(() => {
				setNotFound(true);
				setLoading(false);
			});
	}, [questionId]);

	const handleRate = useCallback(
		(value: number) => {
			setRating(value);
			if (questionId) {
				storeRating(questionId, value);
				setSubmittedRating(value);
				if (value >= 3) {
					setShowAnswer(true);
				}
			}
		},
		[questionId],
	);

	const isUnlocked = useMemo(
		() => showAnswer || submittedRating >= 3,
		[showAnswer, submittedRating],
	);

	if (loading) {
		return (
			<div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 p-6">
				<Skeleton className="h-8 w-48" />
				<Skeleton className="h-32 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	if (notFound || !data) {
		return (
			<div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
				<div className="flex size-16 items-center justify-center rounded-full bg-muted">
					<span className="text-2xl">?</span>
				</div>
				<h1 className="font-bold text-xl">Question Not Found</h1>
				<p className="max-w-md text-muted-foreground text-sm">
					This question may have been removed or the link is invalid.
				</p>
				<a
					href="/dashboard"
					className="mt-2 rounded-xl bg-primary px-5 py-2.5 font-medium text-primary-foreground text-sm"
				>
					Go to Dashboard
				</a>
			</div>
		);
	}

	const q = data.question;

	return (
		<main className="mx-auto min-h-dvh max-w-2xl p-6">
			<div className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						<Badge variant="secondary">{data.subject}</Badge>
						{q.topic && (
							<Badge variant="outline" className="text-xs">
								{q.topic}
							</Badge>
						)}
						<Badge
							variant="outline"
							className={cn(
								"text-xs",
								q.difficulty === "Easy" && "text-success",
								q.difficulty === "Medium" && "text-warning",
								q.difficulty === "Hard" && "text-destructive",
							)}
						>
							{q.difficulty}
						</Badge>
					</div>
					<h1 className="font-bold text-2xl tracking-tight">Shared Question</h1>
				</div>

				<div className="rounded-xl border bg-card p-5">
					<MarkdownRenderer content={q.questionText} subject={data.subject} />
				</div>

				{!isUnlocked && (
					<div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/20 p-6 text-center">
						<p className="font-medium text-sm">
							Rate this question to reveal the answer
						</p>
						<div className="flex gap-1">
							{[1, 2, 3, 4, 5].map((star) => (
								<button
									key={star}
									type="button"
									onClick={() => handleRate(star)}
									className={cn(
										"size-8 rounded-lg p-1 transition-colors",
										star <= rating
											? "text-yellow-500"
											: "text-muted-foreground/30",
									)}
									aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
								>
									<HugeiconsIcon icon={StarIcon} className="size-full" />
								</button>
							))}
						</div>
					</div>
				)}

				{isUnlocked && (
					<>
						{q.explanation && (
							<div className="rounded-xl border bg-card p-5">
								<h2 className="mb-3 font-semibold text-sm">Explanation</h2>
								<MarkdownRenderer
									content={q.explanation}
									subject={data.subject}
								/>
							</div>
						)}

						{q.steps && q.steps.length > 0 && (
							<div className="rounded-xl border bg-card p-5">
								<h2 className="mb-3 font-semibold text-sm">Steps</h2>
								<ol className="flex list-inside list-decimal flex-col gap-2 text-sm">
									{q.steps.map((step) => (
										<li key={step.substring(0, 32)}>
											<MarkdownRenderer content={step} subject={data.subject} />
										</li>
									))}
								</ol>
							</div>
						)}

						{data.sources && data.sources.length > 0 && (
							<VerifiedByPill sources={data.sources} />
						)}

						<div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/20 p-4">
							<p className="text-muted-foreground text-xs">Was this helpful?</p>
							<div className="flex gap-1">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => handleRate(star)}
										className={cn(
											"size-6 rounded p-0.5 transition-colors",
											star <= rating
												? "text-yellow-500"
												: "text-muted-foreground/20",
										)}
										aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
									>
										<HugeiconsIcon icon={StarIcon} className="size-full" />
									</button>
								))}
							</div>
						</div>
					</>
				)}
			</div>
		</main>
	);
}
