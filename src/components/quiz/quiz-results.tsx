"use client";

import {
	Award01Icon,
	CancelCircleIcon,
	CheckmarkCircle01Icon,
	DashboardSquare01Icon,
	Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Confetti } from "@/components/celebration";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { NextActions } from "@/components/quiz/next-actions";
import { ShareResultButton } from "@/components/shared/share-button";
import { VerifiedByPill } from "@/components/tools/communication/verified-by-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { cn } from "@/lib/utils";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { calculateAccuracy, formatTime } from "@/lib/shared/time";
import { iOSEase } from "@/lib/utils/animation";

function getUserAnswerText(answer?: UserAnswer): string {
	if (!answer) return "Skipped";
	if (answer.type === "option-ids" && Array.isArray(answer.value)) {
		return (answer.value as string[]).join(", ");
	}
	if (answer.type === "text" || answer.type === "numeric") {
		return String(answer.value ?? "");
	}
	return JSON.stringify(answer.value ?? "");
}

function getCorrectAnswerText(q: Question): string {
	if (q.type === "multiple-choice") {
		const body = q.body as {
			options?: { id: string; text: string; isCorrect: boolean }[];
		};
		const correct = body?.options?.find((o) => o.isCorrect);
		return correct?.text ?? "";
	}
	if (q.type === "short-answer") {
		const body = q.body as {
			modelAnswer?: string;
			acceptableAnswers?: string[];
		};
		return body?.modelAnswer ?? body?.acceptableAnswers?.[0] ?? "";
	}
	if (q.type === "calculation") {
		const body = q.body as { correctValue?: number; unit?: string };
		return `${body?.correctValue ?? ""} ${body?.unit ?? ""}`.trim();
	}
	return q.explanation?.split(".")[0] ?? "";
}

const CONTAINER_VARIANTS = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: { staggerChildren: 0.1, delayChildren: 0.2 },
	},
};

const ITEM_VARIANTS = {
	hidden: { opacity: 0, y: 20 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			type: "spring" as const,
			stiffness: 300,
			damping: 26,
			bounce: 0,
		},
	},
};

interface QuizResultsCardProps {
	totalQuestions: number;
	correctAnswers: number;
	elapsedTime: number;
	subject: string;
	sources?: { url: string; title: string }[];
	questions?: Question[];
	correctness?: boolean[];
	userAnswers?: UserAnswer[];
	onRestart?: () => void;
	onDashboard?: () => void;
	onPracticeMistakes?: () => void;
	className?: string;
}

export function QuizResultsCard({
	totalQuestions,
	correctAnswers,
	elapsedTime,
	subject,
	sources,
	questions,
	correctness,
	userAnswers,
	onRestart,
	onDashboard,
	onPracticeMistakes,
	className,
}: QuizResultsCardProps) {
	const t = useTranslations();
	const [showReview, setShowReview] = useState(false);
	const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
	const accuracy = calculateAccuracy(correctAnswers, totalQuestions);
	const isGreatScore = accuracy >= 80;
	const isPerfect = accuracy === 100;

	const containerVariants = CONTAINER_VARIANTS;
	const itemVariants = ITEM_VARIANTS;

	return (
		<m.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="relative"
		>
			<Confetti trigger={isGreatScore} count={60} duration={2500} />
			{isPerfect && (
				<m.div
					className="absolute -top-4 left-1/2 -translate-x-1/2"
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
				>
					<Badge
						variant="secondary"
						className="flex items-center gap-2 px-4 py-2 shadow-level-2"
					>
						<HugeiconsIcon icon={Award01Icon} className="size-5" />
						<span className="font-extrabold">{t("quiz.perfectScore")}</span>
					</Badge>
				</m.div>
			)}

			<Card className={cn("relative", className)}>
				<m.div
					className="pointer-events-none absolute inset-0 overflow-hidden rounded-card-lg"
					initial={{ opacity: 0 }}
					animate={isGreatScore ? { opacity: [0, 0.3, 0] } : { opacity: 0 }}
					transition={{ duration: 2, repeat: Infinity }}
				>
					<div className="absolute inset-0 bg-success/10" />
				</m.div>

				<CardHeader className="flex flex-col gap-2 p-6 pb-0 md:text-left">
					<m.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<CardTitle className="font-extrabold text-xl tracking-tight">
							{isPerfect
								? t("quiz.flawless")
								: isGreatScore
									? t("quiz.greatJob")
									: t("quiz.quizComplete")}
						</CardTitle>
					</m.div>
					<p className="text-muted-foreground text-sm">
						{t("quiz.hereAreResults")}
					</p>
				</CardHeader>

				<CardContent>
					<m.div
						className="flex flex-col gap-4"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						<section className="flex flex-col gap-4">
							<m.div
								className="grid grid-cols-12 gap-4 md:text-left"
								variants={itemVariants}
							>
								<m.div
									className="col-span-4 rounded-lg bg-muted p-4"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.3 }}
								>
									<m.p
										className="font-extrabold text-2xl tabular-nums"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.3 }}
									>
										{totalQuestions}
									</m.p>
									<p className="text-muted-foreground text-xs">
										{t("quiz.questions")}
									</p>
								</m.div>
								<m.div
									className="col-span-2 rounded-lg bg-muted p-4"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.4 }}
								>
									<p
										className={cn(
											"font-extrabold text-2xl tabular-nums",
											isGreatScore && "text-success",
										)}
									>
										{correctAnswers}
									</p>
									<p className="text-muted-foreground text-xs">
										{t("quiz.correct")}
									</p>
								</m.div>
								<m.div
									className="col-span-3 rounded-lg bg-muted p-4"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.5 }}
								>
									<p
										className={cn(
											"font-extrabold text-2xl tabular-nums",
											isGreatScore && "text-success",
										)}
									>
										{accuracy}%
									</p>
									<p className="text-muted-foreground text-xs">
										{t("quiz.accuracy")}
									</p>
								</m.div>
								{(() => {
									const aps = getAPSForSubject(accuracy);
									return (
										<m.div
											className="col-span-3 rounded-lg bg-muted p-4"
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 0.6 }}
										>
											<p
												className={cn(
													"font-extrabold text-2xl tabular-nums",
													aps >= 6 && "text-success",
													aps >= 4 && aps < 6 && "text-warning",
													aps < 4 && "text-destructive",
												)}
											>
												{aps}/7
											</p>
											<p className="text-muted-foreground text-xs">
												{getGrade(accuracy)}
											</p>
										</m.div>
									);
								})()}
							</m.div>

							<m.div
								className="grid grid-cols-12 gap-4"
								variants={itemVariants}
							>
								<m.div
									className="col-span-12 rounded-lg bg-muted p-4"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.7 }}
								>
									<p className="font-extrabold text-2xl tabular-nums">
										{formatTime(elapsedTime)}
									</p>
									<p className="text-muted-foreground text-xs">
										{t("quiz.time")}
									</p>
								</m.div>
							</m.div>
						</section>

						<VerifiedByPill sources={sources ?? []} />

						{questions && questions.length > 0 && (
							<m.div variants={itemVariants}>
								<NextActions
									subject={subject}
									correctness={correctness ?? []}
									totalQuestions={totalQuestions}
								/>
							</m.div>
						)}

						{questions && questions.length > 0 && (
							<m.div variants={itemVariants} className="flex flex-col gap-2">
								<button
									type="button"
									onClick={() => setShowReview(!showReview)}
									className="flex items-center justify-between rounded-lg border bg-card px-4 py-3 text-left font-medium text-sm transition-colors hover:bg-muted"
									aria-expanded={showReview}
									aria-controls="question-review-panel"
								>
									<span>Review Answers</span>
									<span className="text-muted-foreground text-xs">
										{showReview ? "Hide" : `Show ${questions.length} questions`}
									</span>
								</button>
								{showReview && (
									<div
										id="question-review-panel"
										className="flex flex-col gap-2"
									>
										{questions.map((q, i) => {
											const isCorrect = correctness?.[i] ?? false;
											const isExpanded = expandedIndex === i;
											const userAns = userAnswers?.[i];
											return (
												<Card
													key={q.id}
													className={cn(
														"overflow-hidden",
														isCorrect
															? "border-success/20"
															: "border-destructive/20",
													)}
												>
													<button
														type="button"
														onClick={() =>
															setExpandedIndex(isExpanded ? null : i)
														}
														className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
														aria-expanded={isExpanded}
													>
														<HugeiconsIcon
															icon={
																isCorrect
																	? CheckmarkCircle01Icon
																	: CancelCircleIcon
															}
															className={cn(
																"size-5 shrink-0",
																isCorrect ? "text-success" : "text-destructive",
															)}
														/>
														<span className="flex-1 truncate font-medium text-sm">
															Question {i + 1}
														</span>
														<span className="shrink-0 text-muted-foreground text-xs">
															{isExpanded ? "▲" : "▼"}
														</span>
													</button>
													{isExpanded && (
														<div className="border-t px-4 py-3">
															<MarkdownRenderer
																content={q.questionText}
																subject={subject}
															/>
															<div className="mt-3 grid grid-cols-2 gap-3">
																{userAns && (
																	<div className="rounded-lg bg-muted p-3">
																		<p className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
																			Your Answer
																		</p>
																		<p className="overflow-wrap-anywhere text-sm">
																			{getUserAnswerText(userAns)}
																		</p>
																	</div>
																)}
																<div
																	className={cn(
																		"rounded-lg p-3",
																		isCorrect
																			? "bg-success/10"
																			: "bg-destructive/10",
																	)}
																>
																	<p className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
																		{isCorrect ? "Answer" : "Correct Answer"}
																	</p>
																	<p className="overflow-wrap-anywhere text-sm">
																		{getCorrectAnswerText(q)}
																	</p>
																</div>
															</div>
															{q.explanation && (
																<div className="mt-3 rounded-lg bg-muted/50 p-3">
																	<p className="mb-1 font-medium text-[10px] text-muted-foreground uppercase tracking-wider">
																		Explanation
																	</p>
																	<MarkdownRenderer
																		content={q.explanation}
																		subject={subject}
																	/>
																</div>
															)}
														</div>
													)}
												</Card>
											);
										})}
										{totalQuestions - correctAnswers > 0 && (
											<Button
												variant="secondary"
												size="sm"
												onClick={onPracticeMistakes}
												className="mt-2 gap-2"
											>
												<HugeiconsIcon
													icon={Refresh01Icon}
													className="size-4"
												/>
												Practice These Topics
											</Button>
										)}
									</div>
								)}
							</m.div>
						)}

						{(onRestart || onDashboard) && (
							<m.div
								className="flex flex-col gap-3 pt-2"
								variants={itemVariants}
							>
								<div className="flex gap-3">
									{onRestart && (
										<Button
											variant="default"
											onClick={onRestart}
											className="flex-1 gap-2"
										>
											<HugeiconsIcon icon={Refresh01Icon} className="size-4" />
											{t("common.retry")}
										</Button>
									)}
									{onDashboard && (
										<Button
											variant="outline"
											onClick={onDashboard}
											className="flex-1 gap-2"
										>
											<HugeiconsIcon
												icon={DashboardSquare01Icon}
												className="size-4"
											/>
											{t("quiz.dashboard")}
										</Button>
									)}
								</div>
								<ShareResultButton
									cardParams={{
										score: correctAnswers,
										total: totalQuestions,
										percentage: accuracy,
										title: `${subject} Quiz`,
										subtitle: `${getAPSForSubject(accuracy)}/7 APS · ${getGrade(accuracy)}`,
										type: "quiz",
									}}
									text={t("quiz.shareText", { accuracy, subject })}
								/>
							</m.div>
						)}
					</m.div>
				</CardContent>
			</Card>
		</m.div>
	);
}
