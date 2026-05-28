"use client";

import { useQuery } from "@tanstack/react-query";
import { usePremium } from "@/lib/premium/premium-context";
import type { Question } from "@/lib/question-engine/types";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";
import type { VisualContent } from "@/lib/visual-engine/types";

interface VisualResult {
	visual: VisualContent | null;
}

async function fetchVisual(question: Question): Promise<VisualResult> {
	try {
		return await apiFetch<VisualResult>("/api/engine/visual", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				questionId: question.id,
				questionText: question.questionText,
				subject: question.subject,
				topic: question.topic,
			}),
		});
	} catch (error) {
		showBudgetToast(error);
		throw error;
	}
}

export function useVisualEngine(question: Question | null) {
	const { hasFeature } = usePremium();
	const isPremium = hasFeature("visual-engine");

	return useQuery({
		queryKey: ["visualEngine", question?.id],
		queryFn: () => {
			if (!question) throw new Error("No question provided");
			return fetchVisual(question);
		},
		enabled: !!question && isPremium,
		staleTime: 1000 * 60 * 60,
		retry: 1,
		select: (data) => data.visual,
	});
}
