"use client";

import {
	ArrowCounterClockwise,
	House,
	Timer,
	Trophy,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Confetti } from "@/components/celebration";
import { ProgressDots } from "@/components/shared/progress-dots";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/shared";
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
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3, ease: iOSEase }}
			className="relative"
		>
			<Confetti trigger={isGreatScore} count={60} duration={2500} />
			{isPerfect && (
				<motion.div
					className="absolute -top-4 left-1/2 -translate-x-1/2"
					initial={{ opacity: 0, scale: 0 }}
					animate={{ opacity: 1, scale: 1 }}
					transition={{ delay: 0.5, type: "spring", stiffness: 300 }}
				>
					<Badge
						variant="secondary"
						className="flex items-center gap-2 px-4 py-2 shadow-lg"
					>
						<Trophy className="size-5" />
						<span className="font-extrabold">Perfect Score!</span>
					</Badge>
				</motion.div>
			)}

			<Card className={cn("relative", className)}>
				<motion.div
					className="absolute inset-0 pointer-events-none rounded-[2.5rem] overflow-hidden"
					initial={{ opacity: 0 }}
					animate={isGreatScore ? { opacity: [0, 0.3, 0] } : { opacity: 0 }}
					transition={{ duration: 2, repeat: Infinity }}
				>
					<div className="absolute inset-0 bg-success/10" />
				</motion.div>

				<CardHeader className="flex flex-col gap-2 p-6 pb-0 md:text-left">
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<CardTitle className="text-xl font-extrabold tracking-tight">
							{isPerfect
								? "Flawless!"
								: isGreatScore
									? "Great Job!"
									: "Quiz Complete!"}
						</CardTitle>
					</motion.div>
					<p className="text-sm text-muted-foreground">
						Here are your results:
					</p>
				</CardHeader>

				<CardContent>
					<motion.div
						className="flex flex-col gap-4"
						variants={containerVariants}
						initial="hidden"
						animate="visible"
					>
						<section className="flex flex-col gap-4">
							<motion.div
								className="grid grid-cols-12 gap-4 md:text-left"
								variants={itemVariants}
							>
								<motion.div
									className="col-span-5 p-4 rounded-lg bg-muted"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.3 }}
								>
									<motion.p
										className="text-2xl font-extrabold tabular-nums"
										initial={{ opacity: 0 }}
										animate={{ opacity: 1 }}
										transition={{ delay: 0.3 }}
									>
										{totalQuestions}
									</motion.p>
									<p className="text-xs text-muted-foreground">Questions</p>
								</motion.div>
								<motion.div
									className="col-span-3 p-4 rounded-lg bg-muted"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.4 }}
								>
									<p
										className={cn(
											"text-2xl font-extrabold tabular-nums",
											isGreatScore && "text-success",
										)}
									>
										{correctAnswers}
									</p>
									<p className="text-xs text-muted-foreground">Correct</p>
								</motion.div>
								<motion.div
									className="col-span-4 p-4 rounded-lg bg-muted"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.5 }}
								>
									<p
										className={cn(
											"text-2xl font-extrabold tabular-nums",
											isGreatScore && "text-success",
										)}
									>
										{accuracy}%
									</p>
									<p className="text-xs text-muted-foreground">Accuracy</p>
								</motion.div>
							</motion.div>
						</section>
					</motion.div>
				</CardContent>
			</Card>
		</motion.div>
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
	correctAnswers,
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
