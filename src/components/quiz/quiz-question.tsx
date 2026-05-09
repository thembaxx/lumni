"use client";

import { IconCheck, IconX } from "@tabler/icons-react";
import { domAnimation, LazyMotion, m } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface QuizQuestionProps {
	question: {
		id: string;
		topicId: string;
		type: string;
		questionText: string;
		options: Record<string, string> | null;
		correctAnswer: string;
		explanation: string | null;
		difficulty: "easy" | "medium" | "hard";
		hasImage: boolean;
		imageUrl: string | null;
		topicName?: string;
	};
	selectedAnswer: string | null;
	showFeedback: boolean;
	onSelectAnswer: (answer: string) => void;
}

export function QuizQuestion({
	question,
	selectedAnswer,
	showFeedback,
	onSelectAnswer,
}: QuizQuestionProps) {
	const options = question.options || {};

	return (
		<LazyMotion features={domAnimation}>
			<Card className="p-4 space-y-4">
				{question.topicName && (
					<p className="text-xs text-muted-foreground">{question.topicName}</p>
				)}

				<p className="text-lg font-medium">{question.questionText}</p>

				{question.hasImage && question.imageUrl && (
					<div className="flex justify-center">
						<Image
							src={question.imageUrl}
							alt="Question diagram"
							width={400}
							height={300}
							className="max-w-full h-auto rounded-lg outline outline-[length] outline-black/10 dark:outline-white/10"
						/>
					</div>
				)}

				<div
					className="space-y-2"
					role="radiogroup"
					aria-label="Answer options"
					onKeyDown={(e) => {
						const optionKeys = Object.keys(options);
						if (!optionKeys.length) return;
						const currentIndex = optionKeys.indexOf(selectedAnswer || "");
						let nextIndex = currentIndex;

						if (e.key === "ArrowDown" || e.key === "ArrowRight") {
							e.preventDefault();
							nextIndex = (currentIndex + 1) % optionKeys.length;
						} else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
							e.preventDefault();
							nextIndex =
								currentIndex <= 0 ? optionKeys.length - 1 : currentIndex - 1;
						}

						if (nextIndex !== currentIndex && nextIndex >= 0) {
							onSelectAnswer(optionKeys[nextIndex]);
						}
					}}
				>
					{Object.entries(options).map(([key, value]) => {
						const isSelected = selectedAnswer === key;
						const isCorrect = key === question.correctAnswer;

						let buttonClass = "w-full justify-start text-left h-auto py-3 px-4";

						if (showFeedback) {
							if (isCorrect) {
								buttonClass += " border-green-500 bg-green-500/20";
							} else if (isSelected && !isCorrect) {
								buttonClass += " border-red-500 bg-red-500/20";
							}
						}

						return (
							<m.div key={key} whileTap={{ scale: 0.96 }}>
								<Button
									variant="outline"
									className={buttonClass}
									onClick={() => onSelectAnswer(key)}
									disabled={showFeedback}
									role="radio"
									aria-checked={isSelected}
								>
									<span className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted mr-3">
										{key}
									</span>
									<span>{value}</span>
									{showFeedback && isCorrect && (
										<IconCheck className="ml-auto w-5 h-5 text-green-500" />
									)}
									{showFeedback && isSelected && !isCorrect && (
										<IconX className="ml-auto w-5 h-5 text-red-500" />
									)}
								</Button>
							</m.div>
						);
					})}
				</div>

				{showFeedback && (
					<div className="flex items-center justify-between pt-2 border-t">
						<span className="text-sm text-muted-foreground">Difficulty:</span>
						<span className="text-sm capitalize">{question.difficulty}</span>
					</div>
				)}
			</Card>
		</LazyMotion>
	);
}