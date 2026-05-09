"use client";

import { motion } from "framer-motion";
import { Home, RotateCcw, Timer, TrophyIcon } from "lucide-react";
import { Confetti } from "@/components/celebration";
import { LottieWrapper } from "@/components/lottie";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { calculateAccuracy, formatTime } from "@/lib/utils/time";

interface QuizResultsCardProps {
	totalQuestions: number;
	correctAnswers: number;
	elapsedTime: number;
	onRestart?: () => void;
	onDashboard?: () => void;
	className?: string;
	useLottie?: boolean;
}

export function QuizResultsCard({
	totalQuestions,
	correctAnswers,
	elapsedTime,
	onRestart,
	onDashboard,
	className,
	useLottie = false,
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
			transition: { type: "spring" as const, stiffness: 300, damping: 25 },
		},
	};

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.95 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
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
					<div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-white shadow-lg">
						{useLottie ? (
							<LottieWrapper animation="success-check" className="w-5 h-5" />
						) : (
							<TrophyIcon className="w-5 h-5" />
						)}
						<span className="font-bold">Perfect Score!</span>
					</div>
				</motion.div>
			)}

			<Card className={cn("overflow-hidden", className)}>
				<motion.div
					className="absolute inset-0 pointer-events-none"
					initial={{ opacity: 0 }}
					animate={isGreatScore ? { opacity: [0, 0.3, 0] } : { opacity: 0 }}
					transition={{ duration: 2, repeat: Infinity }}
				>
					<div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-500/10" />
				</motion.div>

				<CardHeader className="text-center">
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: 0.1 }}
					>
						<CardTitle>
							{isPerfect
								? "Flawless!"
								: isGreatScore
									? "Great Job!"
									: "Quiz Complete!"}
						</CardTitle>
					</motion.div>
					<CardDescription>Here are your results:</CardDescription>
				</CardHeader>

				<motion.div
					className="space-y-4"
					variants={containerVariants}
					initial="hidden"
					animate="visible"
				>
					<CardContent className="space-y-4">
						<motion.div
							className="grid grid-cols-3 gap-4 text-center"
							variants={itemVariants}
						>
							<div className="p-4 rounded-lg bg-muted">
								<motion.p
									className="text-2xl font-bold tabular-nums"
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									transition={{ delay: 0.3 }}
								>
									{totalQuestions}
								</motion.p>
								<p className="text-xs text-muted-foreground">Questions</p>
							</div>
							<motion.div
								className="p-4 rounded-lg bg-muted"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.4 }}
							>
								<p
									className={cn(
										"text-2xl font-bold tabular-nums",
										isGreatScore && "text-green-500",
									)}
								>
									{correctAnswers}
								</p>
								<p className="text-xs text-muted-foreground">Correct</p>
							</motion.div>
							<motion.div
								className="p-4 rounded-lg bg-muted"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								transition={{ delay: 0.5 }}
							>
								<p
									className={cn(
										"text-2xl font-bold tabular-nums",
										isGreatScore && "text-green-500",
									)}
								>
									{accuracy}%
								</p>
								<p className="text-xs text-muted-foreground">Accuracy</p>
							</motion.div>
						</motion.div>

						<motion.div
							className="flex items-center justify-center gap-2 text-muted-foreground"
							variants={itemVariants}
						>
							<Timer className="size-4" />
							<span className="text-sm">{formatTime(elapsedTime)}</span>
						</motion.div>

						<motion.div className="flex gap-2" variants={itemVariants}>
							{onDashboard && (
								<Button
									variant="outline"
									className="flex-1"
									onClick={onDashboard}
								>
									<Home className="size-4 mr-2" />
									Dashboard
								</Button>
							)}
							{onRestart && (
								<Button className="flex-1" onClick={onRestart}>
									<RotateCcw className="size-4 mr-2" />
									Try Again
								</Button>
							)}
						</motion.div>
					</CardContent>
				</motion.div>
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
}: QuizResultsInlineProps) {
	return (
		<div className="flex justify-center gap-1">
			{Array.from({ length: totalQuestions }).map((_, idx) => (
				<div
					key={`result-${idx}`}
					className={
						idx < currentQuestionIndex
							? "h-1.5 w-1.5 rounded-full bg-green-500"
							: "h-1.5 w-1.5 rounded-full bg-muted"
					}
				/>
			))}
		</div>
	);
}
