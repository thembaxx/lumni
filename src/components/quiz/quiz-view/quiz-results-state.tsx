"use client";

import { QuizResultsCard } from "@/components/quiz";
import { DecorativeRightPanel } from "./decorative-right-panel";

interface QuizResultsStateProps {
	totalQuestions: number;
	correctAnswers: number;
	elapsedTime: number;
	subject: string;
	onRestart: () => void;
	onDashboard: () => void;
}

export function QuizResultsState({
	totalQuestions,
	correctAnswers,
	elapsedTime,
	subject,
	onRestart,
	onDashboard,
}: QuizResultsStateProps) {
	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
				<QuizResultsCard
					totalQuestions={totalQuestions}
					correctAnswers={correctAnswers}
					elapsedTime={elapsedTime}
					subject={subject ?? "Quiz"}
					onRestart={onRestart}
					onDashboard={onDashboard}
				/>
			</div>
			<DecorativeRightPanel />
		</div>
	);
}
