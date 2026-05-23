"use client";

import {
	Award01Icon,
	DashboardSquare01Icon,
	Refresh01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Confetti } from "@/components/celebration";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/shared";
import { getAPSForSubject, getGrade } from "@/lib/shared/aps";
import { calculateAccuracy, formatTime } from "@/lib/shared/time";
import { iOSEase } from "@/lib/utils/animation";

interface QuizResultsCardProps {
	totalQuestions: number;
	correctAnswers: number;
	elapsedTime: number;
	onRestart?: () => void;
	onDashboard?: () => void;
	className?: string;
}

export function QuizResultsCard({
	totalQuestions,
	correctAnswers,
	elapsedTime,
	onRestart,
	onDashboard,
	className,
}: QuizResultsCardProps) {
	const accuracy = calculateAccuracy(correctAnswers, totalQuestions);
	const isGreatScore = accuracy >= 80;
	const isPerfect = accuracy === 100;

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: { staggerChildren: 0.1, delayChildren: 0.2 },
		},
	};

	const itemVariants = {
		hidden: { opacity: 0, y: 20 },
		visible: {
			opacity: 1,
			y: 0,
			transition: {
				type: "spring" as const,
				stiffness: 300,
				damping: 25,
				bounce: 0,
			},
		},
	};

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
						className="flex items-center gap-2 px-4 py-2 shadow-lg"
					>
						<HugeiconsIcon icon={Award01Icon} className="size-5" />
						<span className="font-extrabold">Perfect Score!</span>
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
								? "Flawless!"
								: isGreatScore
									? "Great Job!"
									: "Quiz Complete!"}
						</CardTitle>
					</m.div>
					<p className="text-muted-foreground text-sm">
						Here are your results:
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
									<p className="text-muted-foreground text-xs">Questions</p>
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
									<p className="text-muted-foreground text-xs">Correct</p>
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
									<p className="text-muted-foreground text-xs">Accuracy</p>
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
									<p className="text-muted-foreground text-xs">Time</p>
								</m.div>
							</m.div>
						</section>

						{(onRestart || onDashboard) && (
							<m.div className="flex gap-3 pt-2" variants={itemVariants}>
								{onRestart && (
									<Button
										variant="default"
										onClick={onRestart}
										className="flex-1 gap-2"
									>
										<HugeiconsIcon icon={Refresh01Icon} className="size-4" />
										Try Again
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
										Dashboard
									</Button>
								)}
							</m.div>
						)}
					</m.div>
				</CardContent>
			</Card>
		</m.div>
	);
}

interface QuizResultsInlineProps {
	currentQuestionIndex: number;
	totalQuestions: number;
	correctAnswers: number;
}

export function QuizResultsInline({
	currentQuestionIndex,
	totalQuestions,
	correctAnswers: _correctAnswers,
}: QuizResultsInlineProps) {
	return (
		<ProgressDots
			total={totalQuestions}
			currentIndex={currentQuestionIndex}
			completedCount={currentQuestionIndex}
			variant="results"
		/>
	);
}
