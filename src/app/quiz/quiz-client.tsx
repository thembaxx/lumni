"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { QuizView } from "@/components/quiz";

function QuizClientContent() {
	const searchParams = useSearchParams();
	const initialSubject = searchParams.get("subject") || undefined;
	const topic = searchParams.get("topic") || undefined;
	const countParam = searchParams.get("count");
	const questionCount = countParam ? parseInt(countParam, 10) : 20;
	const timeParam = searchParams.get("time");
	const maxTime = timeParam ? parseInt(timeParam, 10) : undefined;

	const handleQuit = () => {
		window.history.back();
	};

	return (
		<QuizView
			initialSubject={initialSubject}
			topic={topic}
			questionCount={questionCount}
			maxTime={maxTime}
			onQuit={handleQuit}
		/>
	);
}

export function QuizClient() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center p-8">
					<div className="size-8 animate-spin rounded-full border-foreground border-b-2" />
				</div>
			}
		>
			<QuizClientContent />
		</Suspense>
	);
}
