"use client";

import { useSearchParams } from "next/navigation";
import { QuizView } from "@/components/quiz";

export function QuizClient() {
	const searchParams = useSearchParams();
	const initialSubject = searchParams.get("subject") || undefined;
	const topic = searchParams.get("topic") || undefined;
	const countParam = searchParams.get("count");
	const questionCount = countParam ? parseInt(countParam, 10) : 20;

	const handleQuit = () => {
		window.history.back();
	};

	return (
		<QuizView
			initialSubject={initialSubject}
			topic={topic}
			questionCount={questionCount}
			onQuit={handleQuit}
		/>
	);
}
