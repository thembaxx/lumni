"use client";

import { useQuery } from "@tanstack/react-query";
import type { VisualContent } from "@/lib/visual-engine/types";
import type { Question } from "@/types/questions";

interface VisualResult {
	visual: VisualContent | null;
}

async function fetchVisual(question: Question): Promise<VisualResult> {
	const response = await fetch("/api/engine/visual", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			questionId: question.id,
			questionText: question.questionText,
			subject: question.subject,
			topic: question.topic,
		}),
	});

	if (!response.ok) {
		throw new Error("Failed to fetch visual content");
	}

	return response.json();
}

export function useVisualEngine(question: Question | null) {
	return useQuery({
		queryKey: ["visualEngine", question?.id],
		queryFn: () => fetchVisual(question!),
		enabled: !!question,
		staleTime: 1000 * 60 * 60,
		retry: 1,
		select: (data) => data.visual,
	});
}
