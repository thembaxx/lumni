"use client";

import { useSearchParams } from "next/navigation";
import { QuizView } from "@/components/quiz";

export function QuizClient() {
	const searchParams = useSearchParams();
	const initialSubject = searchParams.get("subject") || undefined;
	const topic = searchParams.get("topic") || undefined;

	return <QuizView initialSubject={initialSubject} topic={topic} />;
}
