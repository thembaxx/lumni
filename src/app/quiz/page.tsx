import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizClient } from "./quiz-client";

export const metadata: Metadata = {
	title: "Quiz Practice - Lumni",
	description: "Practice your subjects with adaptive quizzes",
};

export default function QuizPage() {
	return (
		<Suspense fallback={null}>
			<QuizClient />
		</Suspense>
	);
}
