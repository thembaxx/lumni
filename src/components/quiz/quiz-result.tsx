"use client";

import {
	IconArrowRight,
	IconHome,
	IconRefresh,
	IconTrophy,
} from "@tabler/icons-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface QuizResultProps {
	results: {
		totalQuestions: number;
		correctAnswers: number;
		accuracy: number;
		incorrectAnswers: {
			questionId: string;
			selectedAnswer: string;
			correctAnswer: string;
		}[];
	};
	onRestart: () => void;
	onClose?: () => void;
}

export function QuizResult({ results, onRestart, onClose }: QuizResultProps) {
	const { totalQuestions, correctAnswers, accuracy, incorrectAnswers } =
		results;

	const getMessage = () => {
		if (accuracy >= 90) return { title: "Outstanding!", emoji: "🎉" };
		if (accuracy >= 70) return { title: "Great job!", emoji: "👏" };
		if (accuracy >= 50) return { title: "Good effort!", emoji: "👍" };
		return { title: "Keep practicing!", emoji: "💪" };
	};

	const message = getMessage();

	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			className="space-y-6"
		>
			<Card className="p-8 flex flex-col items-center text-center gap-4">
				<div className="text-4xl">{message.emoji}</div>
				<h2 className="text-2xl font-bold">{message.title}</h2>

				<div className="grid grid-cols-2 gap-6 w-full max-w-xs">
					<div className="flex flex-col items-center">
						<p className="text-3xl font-bold">{correctAnswers}</p>
						<p className="text-xs text-muted-foreground">Correct</p>
					</div>
					<div className="flex flex-col items-center">
						<p className="text-3xl font-bold">
							{totalQuestions - correctAnswers}
						</p>
						<p className="text-xs text-muted-foreground">Incorrect</p>
					</div>
				</div>

				<div className="w-full">
					<div className="flex items-center justify-between mb-2">
						<span className="text-sm text-muted-foreground">Accuracy</span>
						<span className="text-sm font-medium">{accuracy}%</span>
					</div>
					<div className="h-2 bg-muted rounded-full overflow-hidden">
						<motion.div
							className="h-full bg-primary rounded-full"
							initial={{ width: 0 }}
							animate={{ width: `${accuracy}%` }}
							transition={{ duration: 0.5, delay: 0.3 }}
						/>
					</div>
				</div>

				{incorrectAnswers.length > 0 && (
					<div className="w-full pt-4 border-t">
						<p className="text-sm font-medium mb-2">Review:</p>
						<div className="space-y-1 text-left">
							{incorrectAnswers.slice(0, 3).map((item, idx) => (
								<p key={idx} className="text-xs text-muted-foreground">
									Q{idx + 1}: You answered {item.selectedAnswer}, correct was{" "}
									{item.correctAnswer}
								</p>
							))}
						</div>
					</div>
				)}
			</Card>

			<div className="flex gap-2">
				<Button variant="outline" className="flex-1" onClick={onRestart}>
					<IconRefresh className="w-4 h-4 mr-2" />
					Try Again
				</Button>
				{onClose && (
					<Button className="flex-1" onClick={onClose}>
						<IconHome className="w-4 h-4 mr-2" />
						Dashboard
					</Button>
				)}
			</div>
		</motion.div>
	);
}
