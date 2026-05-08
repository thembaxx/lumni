"use client";

import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import type { QAQuestion } from "@/types/questions";

interface GenerateQuestionsParams {
	subject: string;
	topic?: string;
	count?: number;
	difficulty?: "Easy" | "Medium" | "Hard";
}

interface GeneratedQuestionsResult {
	questions: QAQuestion[];
	provider: string;
}

async function generateQuestionsAPI(
	params: GenerateQuestionsParams,
): Promise<GeneratedQuestionsResult> {
	const response = await fetch("/api/generate-questions", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});

	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to generate questions");
	}

	return response.json();
}

interface UseAIGenerateQuestionsOptions {
	onSuccess?: (questions: QAQuestion[]) => void;
	onError?: (error: Error) => void;
}

export function useAIGenerateQuestions(
	options?: UseAIGenerateQuestionsOptions,
) {
	const [lastProvider, setLastProvider] = useState<string | null>(null);

	const mutation = useMutation({
		mutationFn: generateQuestionsAPI,
		onSuccess: (data) => {
			setLastProvider(data.provider);
			options?.onSuccess?.(data.questions);
		},
		onError: (error) => {
			console.error("AI question generation failed:", error);
			options?.onError?.(error);
		},
	});

	const generate = useCallback(
		(params: GenerateQuestionsParams) => {
			return mutation.mutateAsync(params);
		},
		[mutation],
	);

	const generateAsync = useCallback(
		async (params: GenerateQuestionsParams) => {
			const result = await mutation.mutateAsync(params);
			return result.questions;
		},
		[mutation],
	);

	return {
		generate,
		generateAsync,
		isGenerating: mutation.isPending,
		error: mutation.error,
		lastProvider,
		reset: mutation.reset,
	};
}
